import React from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Alert,
    Stack,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Error as ErrorIcon,
    Refresh as RefreshIcon,
    Home as HomeIcon,
    ExpandMore as ExpandMoreIcon,
    ContentCopy as CopyIcon,
    BugReport as BugIcon,
} from '@mui/icons-material';
import { FallbackProps } from 'react-error-boundary';

interface ErrorFallbackProps extends FallbackProps {
    error: Error;
    resetErrorBoundary: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
    error,
    resetErrorBoundary,
}) => {
    const errorInfo = {
        name: error.name || 'Unknown Error',
        message: error.message || 'An unexpected error occurred',
        stack: error.stack || 'No stack trace available',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: localStorage.getItem('userId') || 'Anonymous',
    };

  // エラー情報をクリップボードにコピー
    const handleCopyError = async () => {
        const errorText = `
Error Report - 料理原価計算システム
=====================================
Time: ${errorInfo.timestamp}
URL: ${errorInfo.url}
User Agent: ${errorInfo.userAgent}
User ID: ${errorInfo.userId}

Error Details:
Name: ${errorInfo.name}
Message: ${errorInfo.message}

Stack Trace:
${errorInfo.stack}
    `.trim();

        try {
            await navigator.clipboard.writeText(errorText);
            alert('エラー情報がクリップボードにコピーされました');
        } catch (err) {
            console.error('Failed to copy error info:', err);
            alert('エラー情報のコピーに失敗しました');
        }
    };

  // ページリロード
    const handleReload = () => {
        window.location.reload();
    };

  // ホームに戻る
    const handleGoHome = () => {
        window.location.href = '/';
    };

  // エラーレポートの送信
    const handleSendReport = () => {
        const subject = encodeURIComponent('料理原価計算システム - エラーレポート');
        const body = encodeURIComponent(`
エラーが発生しました。以下の情報を確認してください：

時刻: ${errorInfo.timestamp}
URL: ${errorInfo.url}
エラー名: ${errorInfo.name}
エラーメッセージ: ${errorInfo.message}

詳細:
${errorInfo.stack}
        `);
            
        window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
    };

  // エラータイプに応じたメッセージ
    const getErrorTypeMessage = (errorName: string) => {
        switch (errorName) {
        case 'ChunkLoadError':
            return 'アプリケーションの読み込みに失敗しました。ページを更新してください。';
        case 'TypeError':
            return 'プログラムの実行中にエラーが発生しました。';
        case 'ReferenceError':
            return 'システムの参照エラーが発生しました。';
        case 'NetworkError':
            return 'ネットワークエラーが発生しました。接続を確認してください。';
        default:
            return '予期しないエラーが発生しました。';
        }
    };

    // エラーの深刻度を判定
    const getErrorSeverity = (errorName: string) => {
        switch (errorName) {
        case 'ChunkLoadError':
            return 'warning';
        case 'NetworkError':
            return 'info';
        default:
            return 'error';
        }
    };

    return (
        <Box
        sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            p: 3,
            bgcolor: 'background.default',
        }}
        >
        <Paper
            elevation={3}
            sx={{
            p: 4,
            maxWidth: 600,
            width: '100%',
            textAlign: 'center',
            }}
        >
            {/* エラーアイコン */}
            <ErrorIcon
            sx={{
                fontSize: 80,
                color: 'error.main',
                mb: 2,
            }}
            />

            {/* エラータイトル */}
            <Typography variant="h4" component="h1" gutterBottom color="error">
            エラーが発生しました
            </Typography>

            {/* エラーメッセージ */}
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {getErrorTypeMessage(errorInfo.name)}
            </Typography>

            {/* エラーアラート */}
            <Alert 
            severity={getErrorSeverity(errorInfo.name) as any}
            sx={{ mb: 3, textAlign: 'left' }}
            >
            <Typography variant="subtitle2" gutterBottom>
                {errorInfo.name}
            </Typography>
            <Typography variant="body2">
                {errorInfo.message}
            </Typography>
            </Alert>

            {/* アクションボタン */}
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
            <Button
                variant="contained"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={resetErrorBoundary}
                size="large"
            >
                再試行
            </Button>
            <Button
                variant="outlined"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={handleReload}
                size="large"
            >
                ページ更新
            </Button>
            <Button
                variant="outlined"
                color="inherit"
                startIcon={<HomeIcon />}
                onClick={handleGoHome}
                size="large"
            >
                ホームに戻る
            </Button>
            </Stack>

            {/* エラー詳細 */}
            <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">
                エラー詳細情報
                </Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Box sx={{ textAlign: 'left' }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <Chip
                    label={errorInfo.name}
                    color="error"
                    variant="outlined"
                    size="small"
                    />
                    <Tooltip title="エラー情報をコピー">
                    <IconButton size="small" onClick={handleCopyError}>
                        <CopyIcon fontSize="small" />
                    </IconButton>
                    </Tooltip>
                </Stack>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>時刻:</strong> {new Date(errorInfo.timestamp).toLocaleString()}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>URL:</strong> {errorInfo.url}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>メッセージ:</strong> {errorInfo.message}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>スタックトレース:</strong>
                </Typography>
                
                <Box
                    component="pre"
                    sx={{
                    bgcolor: 'grey.100',
                    p: 2,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    overflow: 'auto',
                    maxHeight: 200,
                    }}
                >
                    {errorInfo.stack}
                </Box>
                </Box>
            </AccordionDetails>
            </Accordion>

            {/* サポート情報 */}
            <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                問題が続く場合は、サポートチームにお問い合わせください。
            </Typography>
            <Button
                variant="text"
                color="primary"
                startIcon={<BugIcon />}
                onClick={handleSendReport}
                size="small"
            >
                エラーレポートを送信
            </Button>
            </Box>
        </Paper>

        {/* フッター */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
            料理原価計算システム v2.0.0
            </Typography>
        </Box>
        </Box>
    );
};

export default ErrorFallback;