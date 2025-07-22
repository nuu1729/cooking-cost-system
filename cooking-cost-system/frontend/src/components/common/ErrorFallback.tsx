import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Alert,
    AlertTitle,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    Stack,
    useTheme,
} from '@mui/material';
import {
    Error as ErrorIcon,
    Refresh as RefreshIcon,
    Home as HomeIcon,
    BugReport as BugReportIcon,
    ExpandMore as ExpandMoreIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { FallbackProps } from 'react-error-boundary';

interface ExtendedFallbackProps extends FallbackProps {
    resetErrorBoundary?: () => void;
}

const ErrorFallback: React.FC<ExtendedFallbackProps> = ({ 
    error, 
    resetErrorBoundary 
}) => {
    const theme = useTheme();
    const navigate = useNavigate();

    // エラータイプの判定
    const getErrorType = (error: Error) => {
        if (error.name === 'ChunkLoadError') return 'CHUNK_LOAD_ERROR';
        if (error.message.includes('Network Error')) return 'NETWORK_ERROR';
        if (error.message.includes('timeout')) return 'TIMEOUT_ERROR';
        if (error.name === 'TypeError') return 'TYPE_ERROR';
        if (error.name === 'ReferenceError') return 'REFERENCE_ERROR';
        return 'UNKNOWN_ERROR';
    };

    // エラーメッセージの日本語化
    const getJapaneseErrorMessage = (error: Error, errorType: string) => {
        switch (errorType) {
            case 'CHUNK_LOAD_ERROR':
                return 'アプリケーションの読み込みに失敗しました。ページを再読み込みしてください。';
            case 'NETWORK_ERROR':
                return 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
            case 'TIMEOUT_ERROR':
                return 'リクエストがタイムアウトしました。しばらく待ってから再試行してください。';
            case 'TYPE_ERROR':
                return 'データの形式に問題があります。';
            case 'REFERENCE_ERROR':
                return 'プログラムの参照エラーが発生しました。';
            default:
                return '予期しないエラーが発生しました。';
        }
    };

    const errorType = getErrorType(error);
    const errorMessage = getJapaneseErrorMessage(error, errorType);

    // エラー情報の収集
    const errorInfo = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        type: errorType,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        buildTime: import.meta.env.VITE_BUILD_TIME || 'unknown',
        nodeEnv: import.meta.env.NODE_ENV,
    };

    // リフレッシュ処理
    const handleRefresh = () => {
        if (resetErrorBoundary) {
            resetErrorBoundary();
        } else {
            window.location.reload();
        }
    };

    // ホームに戻る
    const handleGoHome = () => {
        navigate('/');
        if (resetErrorBoundary) {
            resetErrorBoundary();
        }
    };

    // エラーレポートの生成
    const generateErrorReport = () => {
        const report = {
            ...errorInfo,
            reproductionSteps: '再現手順を記入してください',
            expectedBehavior: '期待される動作を記入してください',
            actualBehavior: '実際の動作を記入してください',
        };
        
        const reportText = JSON.stringify(report, null, 2);
        const blob = new Blob([reportText], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `error-report-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // エラーをコピー
    const copyErrorInfo = async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(errorInfo, null, 2));
            alert('エラー情報をクリップボードにコピーしました');
        } catch (err) {
            console.error('Failed to copy error info:', err);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
                p: 3,
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    maxWidth: 600,
                    width: '100%',
                    p: 4,
                    textAlign: 'center',
                }}
            >
                {/* エラーアイコン */}
                <Box sx={{ mb: 3 }}>
                    <ErrorIcon
                        sx={{
                            fontSize: 64,
                            color: 'error.main',
                            mb: 2,
                        }}
                    />
                    <Typography variant="h4" component="h1" gutterBottom>
                        エラーが発生しました
                    </Typography>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        {errorMessage}
                    </Typography>
                </Box>

                {/* エラータイプ表示 */}
                <Box sx={{ mb: 3 }}>
                    <Chip
                        label={errorType}
                        color="error"
                        variant="outlined"
                        icon={<BugReportIcon />}
                    />
                </Box>

                {/* アクションボタン */}
                <Stack spacing={2} direction="row" sx={{ mb: 3, justifyContent: 'center' }}>
                    <Button
                        variant="contained"
                        startIcon={<RefreshIcon />}
                        onClick={handleRefresh}
                        color="primary"
                    >
                        再読み込み
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<HomeIcon />}
                        onClick={handleGoHome}
                    >
                        ホームに戻る
                    </Button>
                </Stack>

                {/* 対処方法の提案 */}
                <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
                    <AlertTitle>対処方法</AlertTitle>
                    <Box component="ol" sx={{ pl: 2, m: 0 }}>
                        <li>ページを再読み込みしてください</li>
                        <li>ブラウザのキャッシュをクリアしてください</li>
                        <li>インターネット接続を確認してください</li>
                        <li>問題が解決しない場合は管理者にお問い合わせください</li>
                    </Box>
                </Alert>

                {/* エラー詳細情報（折りたたみ） */}
                <Accordion sx={{ textAlign: 'left' }}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="error-details-content"
                        id="error-details-header"
                    >
                        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <InfoIcon fontSize="small" />
                            エラー詳細情報
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, mb: 2 }}>
                            <Typography variant="body2" component="pre" sx={{ 
                                whiteSpace: 'pre-wrap', 
                                wordBreak: 'break-all',
                                fontSize: '0.75rem',
                                fontFamily: 'monospace'
                            }}>
                                {JSON.stringify(errorInfo, null, 2)}
                            </Typography>
                        </Box>
                        
                        <Stack spacing={1} direction="row">
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={copyErrorInfo}
                            >
                                情報をコピー
                            </Button>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={generateErrorReport}
                                startIcon={<BugReportIcon />}
                            >
                                レポート出力
                            </Button>
                        </Stack>
                    </AccordionDetails>
                </Accordion>

                {/* フッター情報 */}
                <Box sx={{ mt: 4, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="caption" color="text.secondary">
                        料理原価計算システム v2.0 - Error Boundary
                    </Typography>
                    <br />
                    <Typography variant="caption" color="text.secondary">
                        エラー ID: {Date.now().toString(36)}
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
};

export default ErrorFallback;