import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Backdrop,
  Fade,
  LinearProgress,
  Skeleton,
  Card,
  CardContent,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

// 基本的なローディングスピナー
interface LoadingSpinnerProps {
  size?: number | 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'inherit';
  message?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  variant?: 'circular' | 'linear' | 'dots' | 'pulse';
  thickness?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'primary',
  message,
  fullScreen = false,
  overlay = false,
  variant = 'circular',
  thickness = 3.6,
}) => {
  const getSize = () => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'small': return 24;
      case 'large': return 60;
      default: return 40;
    }
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'linear':
        return (
          <Box sx={{ width: '100%', maxWidth: 300 }}>
            <LinearProgress color={color} />
          </Box>
        );

      case 'dots':
        return (
          <Box display="flex" gap={0.5}>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5] 
                }}
                transition={{ 
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2 
                }}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: color === 'primary' ? '#1976d2' : '#dc004e',
                }}
              />
            ))}
          </Box>
        );

      case 'pulse':
        return (
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.8, 1, 0.8] 
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity 
            }}
          >
            <CircularProgress 
              size={getSize()} 
              color={color} 
              thickness={thickness} 
            />
          </motion.div>
        );

      default:
        return (
          <CircularProgress 
            size={getSize()} 
            color={color} 
            thickness={thickness} 
          />
        );
    }
  };

  const content = (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
      p={2}
    >
      {renderSpinner()}
      {message && (
        <Typography 
          variant="body2" 
          color="text.secondary" 
          textAlign="center"
          sx={{ mt: 1 }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );

  if (fullScreen) {
    return (
      <Backdrop
        open
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      >
        <Fade in timeout={300}>
          <Box>{content}</Box>
        </Fade>
      </Backdrop>
    );
  }

  if (overlay) {
    return (
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
        bgcolor="rgba(255, 255, 255, 0.8)"
        zIndex={1000}
        borderRadius="inherit"
      >
        {content}
      </Box>
    );
  }

  return content;
};

// ページ全体のローディング
export const PageLoading: React.FC<{ message?: string }> = ({ message = '読み込み中...' }) => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    minHeight="60vh"
    gap={2}
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    >
      <CircularProgress size={50} />
    </motion.div>
    <Typography variant="h6" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

// ボタン内のローディング
export const ButtonLoading: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <CircularProgress size={size} color="inherit" thickness={4} />
);

// インライン要素のローディング
export const InlineLoading: React.FC<{ 
  text?: string; 
  size?: number;
  color?: string;
}> = ({ 
  text = '読み込み中', 
  size = 16,
  color = 'text.secondary'
}) => (
  <Box display="flex" alignItems="center" gap={1}>
    <CircularProgress size={size} />
    <Typography variant="body2" color={color}>
      {text}
    </Typography>
  </Box>
);

// スケルトンローディング
export const SkeletonCard: React.FC<{
  rows?: number;
  showAvatar?: boolean;
  showTitle?: boolean;
}> = ({ 
  rows = 3, 
  showAvatar = false, 
  showTitle = true 
}) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" gap={2} mb={showTitle ? 2 : 0}>
        {showAvatar && (
          <Skeleton variant="circular" width={40} height={40} />
        )}
        {showTitle && (
          <Skeleton variant="text" width="60%" height={24} />
        )}
      </Box>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton 
          key={index}
          variant="text" 
          width={index === rows - 1 ? '80%' : '100%'} 
          height={20}
          sx={{ mb: 0.5 }}
        />
      ))}
    </CardContent>
  </Card>
);

// リストのスケルトン
export const SkeletonList: React.FC<{ 
  items?: number;
  showAvatar?: boolean;
}> = ({ 
  items = 5, 
  showAvatar = false 
}) => (
  <Box>
    {Array.from({ length: items }).map((_, index) => (
      <Box key={index} display="flex" alignItems="center" gap={2} py={1}>
        {showAvatar && (
          <Skeleton variant="circular" width={32} height={32} />
        )}
        <Box flex={1}>
          <Skeleton variant="text" width="70%" height={20} />
          <Skeleton variant="text" width="40%" height={16} />
        </Box>
      </Box>
    ))}
  </Box>
);

// テーブルのスケルトン
export const SkeletonTable: React.FC<{ 
  rows?: number;
  columns?: number;
}> = ({ 
  rows = 5, 
  columns = 4 
}) => (
  <Box>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <Box key={rowIndex} display="flex" gap={2} py={1} borderBottom="1px solid #eee">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton 
            key={colIndex}
            variant="text" 
            width={colIndex === 0 ? '30%' : '20%'} 
            height={20}
          />
        ))}
      </Box>
    ))}
  </Box>
);

// チャートのスケルトン
export const SkeletonChart: React.FC<{ 
  height?: number;
  type?: 'bar' | 'line' | 'pie';
}> = ({ 
  height = 300,
  type = 'bar'
}) => (
  <Box height={height} display="flex" alignItems="end" gap={1} p={2}>
    {type === 'pie' ? (
      <Skeleton variant="circular" width={height - 40} height={height - 40} />
    ) : (
      Array.from({ length: 8 }).map((_, index) => (
        <Skeleton 
          key={index}
          variant="rectangular" 
          width="12%" 
          height={Math.random() * (height - 80) + 40}
        />
      ))
    )}
  </Box>
);

// アニメーション付きローディング
export const AnimatedLoading: React.FC<{
  type?: 'bounce' | 'wave' | 'pulse' | 'rotate';
  color?: string;
  size?: number;
}> = ({ 
  type = 'bounce',
  color = '#1976d2',
  size = 40 
}) => {
  const animations = {
    bounce: {
      y: [0, -20, 0],
      transition: { duration: 0.6, repeat: Infinity }
    },
    wave: {
      y: [0, -10, 0],
      transition: { duration: 1, repeat: Infinity, delay: 0.2 }
    },
    pulse: {
      scale: [1, 1.2, 1],
      transition: { duration: 1, repeat: Infinity }
    },
    rotate: {
      rotate: 360,
      transition: { duration: 2, repeat: Infinity, ease: "linear" }
    }
  };

  return (
    <Box display="flex" alignItems="center" justifyContent="center" p={2}>
      <motion.div
        animate={animations[type]}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: color,
        }}
      />
    </Box>
  );
};

// 条件付きローディング（データの状態に応じて表示を切り替え）
export const ConditionalLoading: React.FC<{
  isLoading: boolean;
  isEmpty?: boolean;
  error?: string | null;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
}> = ({
  isLoading,
  isEmpty = false,
  error,
  children,
  loadingComponent,
  emptyComponent,
  errorComponent,
}) => {
  if (error) {
    return (
      <>
        {errorComponent || (
          <Box textAlign="center" py={4}>
            <Typography color="error">エラーが発生しました: {error}</Typography>
          </Box>
        )}
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        {loadingComponent || <LoadingSpinner message="読み込み中..." />}
      </>
    );
  }

  if (isEmpty) {
    return (
      <>
        {emptyComponent || (
          <Box textAlign="center" py={4}>
            <Typography color="text.secondary">データがありません</Typography>
          </Box>
        )}
      </>
    );
  }

  return <>{children}</>;
};

export default LoadingSpinner;
