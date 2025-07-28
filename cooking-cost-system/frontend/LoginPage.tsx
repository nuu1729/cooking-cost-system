import React, { useState, useEffect } from 'react';
import { Navigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Container,
  Link,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
  Chip,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  PersonAdd as RegisterIcon,
  Restaurant as RestaurantIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';

import { useAuth } from '../contexts/AuthContext';
import { LoginRequest, RegisterRequest } from '../types';

// バリデーションスキーマ
const loginSchema = yup.object({
  username: yup.string().required('ユーザー名は必須です'),
  password: yup.string().required('パスワードは必須です'),
});

const registerSchema = yup.object({
  username: yup.string()
    .required('ユーザー名は必須です')
    .min(3, 'ユーザー名は3文字以上で入力してください')
    .max(50, 'ユーザー名は50文字以下で入力してください'),
  email: yup.string()
    .required('メールアドレスは必須です')
    .email('正しいメールアドレスを入力してください'),
  password: yup.string()
    .required('パスワードは必須です')
    .min(6, 'パスワードは6文字以上で入力してください'),
  confirmPassword: yup.string()
    .required('パスワード確認は必須です')
    .oneOf([yup.ref('password')], 'パスワードが一致しません'),
});

const LoginPage: React.FC = () => {
  const { login, register, isAuthenticated, isLoading, error, authEnabled } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isLogin = mode === 'login';
  const schema = isLogin ? loginSchema : registerSchema;

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: isLogin 
      ? { username: '', password: '' }
      : { username: '', email: '', password: '', confirmPassword: '' },
  });

  // 認証が無効な場合は自動的にメインページにリダイレクト
  useEffect(() => {
    if (!authEnabled) {
      // AuthContextで認証が無効の場合、ダミーユーザーが設定される
    }
  }, [authEnabled]);

  // 既にログイン済みの場合はメインページにリダイレクト
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (data: any) => {
    try {
      if (isLogin) {
        const loginData: LoginRequest = {
          username: data.username,
          password: data.password,
        };
        await login(loginData);
      } else {
        const registerData: RegisterRequest = {
          username: data.username,
          email: data.email,
          password: data.password,
        };
        const success = await register(registerData);
        if (success) {
          setMode('login');
          reset();
        }
      }
    } catch (err) {
      console.error('Authentication error:', err);
    }
  };

  const handleModeSwitch = () => {
    setMode(isLogin ? 'register' : 'login');
    reset();
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <motion.div
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={{ duration: 0.3 }}
        >
          <Paper
            elevation={8}
            sx={{
              p: 4,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
            }}
          >
            {/* ヘッダー */}
            <Box textAlign="center" mb={4}>
              <Box display="flex" justifyContent="center" mb={2}>
                <RestaurantIcon 
                  sx={{ 
                    fontSize: 48, 
                    color: 'primary.main',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                  }} 
                />
              </Box>
              <Typography variant="h4" component="h1" fontWeight="bold" color="primary" gutterBottom>
                料理原価計算システム
              </Typography>
              <Typography variant="body2" color="text.secondary">
                v{import.meta.env.VITE_APP_VERSION || '2.0.0'}
              </Typography>
            </Box>

            {/* 認証無効の場合の表示 */}
            {!authEnabled && (
              <Alert severity="info" sx={{ mb: 3 }}>
                認証機能は無効になっています。そのままメインページに移動します。
              </Alert>
            )}

            {/* エラー表示 */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* フォーム */}
            {authEnabled && (
              <>
                {/* モード切り替え */}
                <Box display="flex" justifyContent="center" mb={3}>
                  <Chip
                    label="ログイン"
                    color={isLogin ? 'primary' : 'default'}
                    variant={isLogin ? 'filled' : 'outlined'}
                    onClick={() => setMode('login')}
                    sx={{ mr: 1, cursor: 'pointer' }}
                  />
                  <Chip
                    label="新規登録"
                    color={!isLogin ? 'primary' : 'default'}
                    variant={!isLogin ? 'filled' : 'outlined'}
                    onClick={() => setMode('register')}
                    sx={{ cursor: 'pointer' }}
                  />
                </Box>

                <form onSubmit={handleSubmit(onSubmit)}>
                  <Box display="flex" flexDirection="column" gap={2}>
                    {/* ユーザー名 */}
                    <Controller
                      name="username"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="ユーザー名"
                          error={!!errors.username}
                          helperText={errors.username?.message}
                          disabled={isSubmitting || isLoading}
                        />
                      )}
                    />

                    {/* メールアドレス（登録時のみ） */}
                    {!isLogin && (
                      <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="メールアドレス"
                            type="email"
                            error={!!errors.email}
                            helperText={errors.email?.message}
                            disabled={isSubmitting || isLoading}
                          />
                        )}
                      />
                    )}

                    {/* パスワード */}
                    <Controller
                      name="password"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="パスワード"
                          type={showPassword ? 'text' : 'password'}
                          error={!!errors.password}
                          helperText={errors.password?.message}
                          disabled={isSubmitting || isLoading}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => setShowPassword(!showPassword)}
                                  edge="end"
                                >
                                  {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />

                    {/* パスワード確認（登録時のみ） */}
                    {!isLogin && (
                      <Controller
                        name="confirmPassword"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="パスワード確認"
                            type={showConfirmPassword ? 'text' : 'password'}
                            error={!!errors.confirmPassword}
                            helperText={errors.confirmPassword?.message}
                            disabled={isSubmitting || isLoading}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    edge="end"
                                  >
                                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                          />
                        )}
                      />
                    )}

                    {/* 送信ボタン */}
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      disabled={isSubmitting || isLoading}
                      startIcon={
                        isSubmitting || isLoading ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : isLogin ? (
                          <LoginIcon />
                        ) : (
                          <RegisterIcon />
                        )
                      }
                      sx={{ mt: 2, py: 1.5 }}
                    >
                      {isSubmitting || isLoading 
                        ? '処理中...' 
                        : isLogin 
                          ? 'ログイン' 
                          : '新規登録'
                      }
                    </Button>
                  </Box>
                </form>

                {/* フッター */}
                <Box mt={3} textAlign="center">
                  <Divider sx={{ my: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      または
                    </Typography>
                  </Divider>
                  
                  <Typography variant="body2" color="text.secondary">
                    {isLogin ? 'アカウントをお持ちでない方は' : '既にアカウントをお持ちの方は'}
                    <Link
                      component="button"
                      variant="body2"
                      onClick={handleModeSwitch}
                      sx={{ ml: 0.5 }}
                    >
                      {isLogin ? '新規登録' : 'ログイン'}
                    </Link>
                  </Typography>
                </Box>
              </>
            )}

            {/* システム情報 */}
            <Box mt={4} pt={2} borderTop={1} borderColor="divider">
              <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
                © 2024 料理原価計算システム. All rights reserved.
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default LoginPage;
