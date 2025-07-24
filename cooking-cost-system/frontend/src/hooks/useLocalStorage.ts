import { useCallback } from 'react';
import toast, { 
  Toast, 
  ToastOptions, 
  toast as hotToast,
  Toaster as HotToaster 
} from 'react-hot-toast';

interface ToastMessage {
  type: 'success' | 'error' | 'info' | 'warning' | 'loading';
  message: string;
  duration?: number;
  id?: string;
}

interface UseToastReturn {
  showToast: (message: ToastMessage) => string;
  success: (message: string, options?: ToastOptions) => string;
  error: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
  warning: (message: string, options?: ToastOptions) => string;
  loading: (message: string, options?: ToastOptions) => string;
  dismiss: (toastId?: string) => void;
  dismissAll: () => void;
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: ToastOptions
  ) => Promise<T>;
}

export const useToast = (): UseToastReturn => {
  const showToast = useCallback((message: ToastMessage): string => {
    const options: ToastOptions = {
      duration: message.duration || getDefaultDuration(message.type),
      id: message.id,
    };

    switch (message.type) {
      case 'success':
        return toast.success(message.message, options);
      case 'error':
        return toast.error(message.message, options);
      case 'loading':
        return toast.loading(message.message, options);
      case 'warning':
        return toast(message.message, {
          ...options,
          icon: '⚠️',
          style: {
            background: '#ff9800',
            color: '#fff',
          },
        });
      case 'info':
        return toast(message.message, {
          ...options,
          icon: 'ℹ️',
          style: {
            background: '#2196f3',
            color: '#fff',
          },
        });
      default:
        return toast(message.message, options);
    }
  }, []);

  const success = useCallback((message: string, options?: ToastOptions): string => {
    return toast.success(message, options);
  }, []);

  const error = useCallback((message: string, options?: ToastOptions): string => {
    return toast.error(message, options);
  }, []);

  const info = useCallback((message: string, options?: ToastOptions): string => {
    return toast(message, {
      icon: 'ℹ️',
      style: {
        background: '#2196f3',
        color: '#fff',
      },
      ...options,
    });
  }, []);

  const warning = useCallback((message: string, options?: ToastOptions): string => {
    return toast(message, {
      icon: '⚠️',
      style: {
        background: '#ff9800',
        color: '#fff',
      },
      ...options,
    });
  }, []);

  const loading = useCallback((message: string, options?: ToastOptions): string => {
    return toast.loading(message, options);
  }, []);

  const dismiss = useCallback((toastId?: string): void => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  }, []);

  const dismissAll = useCallback((): void => {
    toast.dismiss();
  }, []);

  const promise = useCallback(<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: ToastOptions
  ): Promise<T> => {
    return toast.promise(promise, messages, options);
  }, []);

  return {
    showToast,
    success,
    error,
    info,
    warning,
    loading,
    dismiss,
    dismissAll,
    promise,
  };
};

// デフォルトの表示時間を取得
const getDefaultDuration = (type: ToastMessage['type']): number => {
  switch (type) {
    case 'success':
      return 3000;
    case 'error':
      return 5000;
    case 'warning':
      return 4000;
    case 'info':
      return 4000;
    case 'loading':
      return Infinity;
    default:
      return 4000;
  }
};

// トーストプロバイダーのデフォルト設定
export const toastConfig = {
  position: 'top-right' as const,
  reverseOrder: false,
  gutter: 8,
  containerStyle: {},
  toastOptions: {
    className: '',
    duration: 4000,
    style: {
      background: '#363636',
      color: '#fff',
      borderRadius: '8px',
      padding: '12px 16px',
      fontSize: '14px',
      fontFamily: '"Noto Sans JP", sans-serif',
    },
    success: {
      duration: 3000,
      iconTheme: {
        primary: '#4caf50',
        secondary: '#fff',
      },
      style: {
        background: '#4caf50',
        color: '#fff',
      },
    },
    error: {
      duration: 5000,
      iconTheme: {
        primary: '#f44336',
        secondary: '#fff',
      },
      style: {
        background: '#f44336',
        color: '#fff',
      },
    },
    loading: {
      duration: Infinity,
    },
  },
};

export default useToast;
