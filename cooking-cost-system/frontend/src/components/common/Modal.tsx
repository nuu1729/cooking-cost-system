import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Slide,
  Fade,
  Zoom,
  Grow,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';

// アニメーション用のトランジション
const SlideTransition = React.forwardRef<
  unknown,
  TransitionProps & { children: React.ReactElement<any, any> }
>((props, ref) => <Slide direction="up" ref={ref} {...props} />);

const FadeTransition = React.forwardRef<
  unknown,
  TransitionProps & { children: React.ReactElement<any, any> }
>((props, ref) => <Fade ref={ref} {...props} />);

const ZoomTransition = React.forwardRef<
  unknown,
  TransitionProps & { children: React.ReactElement<any, any> }
>((props, ref) => <Zoom ref={ref} {...props} />);

const GrowTransition = React.forwardRef<
  unknown,
  TransitionProps & { children: React.ReactElement<any, any> }
>((props, ref) => <Grow ref={ref} {...props} />);

// モーダルのプロパティ
interface BaseModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  fullWidth?: boolean;
  fullScreen?: boolean;
  disableEscapeKeyDown?: boolean;
  disableBackdropClick?: boolean;
  showCloseButton?: boolean;
  animation?: 'slide' | 'fade' | 'zoom' | 'grow';
  className?: string;
  contentSx?: object;
  titleSx?: object;
  actionsSx?: object;
}

// 基本モーダルコンポーネント
export const Modal: React.FC<BaseModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  fullScreen = false,
  disableEscapeKeyDown = false,
  disableBackdropClick = false,
  showCloseButton = true,
  animation = 'fade',
  className,
  contentSx,
  titleSx,
  actionsSx,
}) => {
  const getTransitionComponent = () => {
    switch (animation) {
      case 'slide': return SlideTransition;
      case 'zoom': return ZoomTransition;
      case 'grow': return GrowTransition;
      default: return FadeTransition;
    }
  };

  const handleClose = (_: any, reason?: string) => {
    if (disableBackdropClick && reason === 'backdropClick') {
      return;
    }
    if (disableEscapeKeyDown && reason === 'escapeKeyDown') {
      return;
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      fullScreen={fullScreen}
      TransitionComponent={getTransitionComponent()}
      className={className}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 2,
          minHeight: fullScreen ? '100vh' : 'auto',
        },
      }}
    >
      {/* ヘッダー */}
      {(title || showCloseButton) && (
        <DialogTitle sx={{ pb: subtitle ? 1 : 2, ...titleSx }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              {title && (
                <Typography variant="h6" component="div">
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
            {showCloseButton && (
              <IconButton
                aria-label="close"
                onClick={onClose}
                sx={{
                  color: (theme) => theme.palette.grey[500],
                }}
              >
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
      )}

      {/* コンテンツ */}
      <DialogContent sx={{ ...contentSx }}>
        {children}
      </DialogContent>

      {/* アクション */}
      {actions && (
        <DialogActions sx={{ px: 3, pb: 2, ...actionsSx }}>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

// 確認ダイアログ
interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '確認',
  cancelText = 'キャンセル',
  severity = 'warning',
  isLoading = false,
}) => {
  const getSeverityColor = () => {
    switch (severity) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'success': return 'success';
      default: return 'primary';
    }
  };

  const getSeverityIcon = () => {
    switch (severity) {
      case 'error': return '⚠️';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="xs"
      animation="zoom"
      disableBackdropClick={isLoading}
      disableEscapeKeyDown={isLoading}
      actions={
        <Box display="flex" gap={1}>
          <button 
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              background: 'white',
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              background: getSeverityColor() === 'error' ? '#f44336' : '#1976d2',
              color: 'white',
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? '処理中...' : confirmText}
          </button>
        </Box>
      }
    >
      <Box display="flex" alignItems="center" gap={2}>
        <Typography variant="h4">{getSeverityIcon()}</Typography>
        <Typography>{message}</Typography>
      </Box>
    </Modal>
  );
};

// フォームモーダル
interface FormModalProps extends Omit<BaseModalProps, 'actions'> {
  onSubmit?: () => void;
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  showCancelButton?: boolean;
}

export const FormModal: React.FC<FormModalProps> = ({
  onSubmit,
  onCancel,
  submitText = '保存',
  cancelText = 'キャンセル',
  isSubmitting = false,
  submitDisabled = false,
  showCancelButton = true,
  ...modalProps
}) => {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      modalProps.onClose();
    }
  };

  return (
    <Modal
      {...modalProps}
      disableBackdropClick={isSubmitting}
      disableEscapeKeyDown={isSubmitting}
      actions={
        <Box display="flex" gap={1}>
          {showCancelButton && (
            <button 
              onClick={handleCancel}
              disabled={isSubmitting}
              style={{
                padding: '8px 16px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: 'white',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {cancelText}
            </button>
          )}
          {onSubmit && (
            <button 
              onClick={onSubmit}
              disabled={isSubmitting || submitDisabled}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                background: (isSubmitting || submitDisabled) ? '#ccc' : '#1976d2',
                color: 'white',
                cursor: (isSubmitting || submitDisabled) ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? '保存中...' : submitText}
            </button>
          )}
        </Box>
      }
    />
  );
};

// 情報表示モーダル
interface InfoModalProps extends Omit<BaseModalProps, 'actions'> {
  severity?: 'info' | 'success' | 'warning' | 'error';
  showOkButton?: boolean;
  okText?: string;
}

export const InfoModal: React.FC<InfoModalProps> = ({
  severity = 'info',
  showOkButton = true,
  okText = 'OK',
  ...modalProps
}) => {
  const getSeverityIcon = () => {
    switch (severity) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  return (
    <Modal
      {...modalProps}
      maxWidth="xs"
      animation="zoom"
      title={
        <Box display="flex" alignItems="center" gap={1}>
          <span>{getSeverityIcon()}</span>
          {modalProps.title}
        </Box>
      }
      actions={
        showOkButton ? (
          <button 
            onClick={modalProps.onClose}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              background: '#1976d2',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            {okText}
          </button>
        ) : undefined
      }
    />
  );
};

// フルスクリーンモーダル
export const FullScreenModal: React.FC<BaseModalProps> = (props) => {
  return (
    <Modal
      {...props}
      fullScreen
      maxWidth={false}
      animation="slide"
    />
  );
};

// ドラッグ可能なモーダル
export const DraggableModal: React.FC<BaseModalProps> = (props) => {
  // ドラッグ機能は複雑になるため、基本的なモーダルとして実装
  // 実際のドラッグ機能が必要な場合は react-draggable などのライブラリを使用
  return (
    <Modal
      {...props}
      animation="fade"
    />
  );
};

export default Modal;
