import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api';
import { accountStore } from '@/stores/accountStore';
import { toBackendUrl } from '@/utils/url';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

// Validation Schema
const schema = yup.object({
    email: yup
        .string()
        .required('メールアドレスは必須です'),
    password: yup
        .string()
        .required('パスワードは必須です')
        .min(1, 'パスワードを入力してください'),
}).required();

type FormData = yup.InferType<typeof schema>;

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        resolver: yupResolver(schema),
        mode: 'onBlur',
    });

    const onSubmit = async (data: FormData) => {
        setErrorMessage(null);
        try {
            const response = await authApi.login({
                username: data.email,
                password: data.password
            });

            if (response.success && response.data) {
                localStorage.setItem('authToken', response.data.token);
                const user = response.data.user as any;
                accountStore.initForUser(user.id, user.username, user.email, toBackendUrl(user.icon_url), toBackendUrl(user.home_bg_url));
                navigate('/');
            } else {
                throw new Error('ログインに失敗しました。');
            }
        } catch (err: any) {
            const message = err?.response?.data?.message;
            setErrorMessage(message || 'ログインに失敗しました。時間をおいて再度お試しください。');
        }
    };

    return (
        <div className="h-screen w-full bg-white flex flex-col font-sans text-gray-800 overflow-hidden">
            {/* Simple Header matching Figma */}
            <header className="h-[80px] bg-[#d9d9d9] flex items-center px-8 border-b border-gray-300">
                <h2 className="text-xl font-bold text-black tracking-tight">
                    料理原価計算システム
                </h2>
            </header>

            <main className="flex-grow flex flex-col md:flex-row items-center justify-center w-full max-w-7xl mx-auto px-0 py-2 md:py-10">

                {/* Left Side: Text */}
                <div className="w-full md:w-1/2 flex items-center justify-center md:justify-start pl-0 md:pl-5 mb-10 md:mb-0">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl md:text-6xl font-bold text-black tracking-wide"
                    >
                        まずは、ログイン
                    </motion.h1>
                </div>

                {/* Right Side: Card */}
                <div className="w-full md:w-1/2 flex justify-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="bg-[#D9D9D9] p-6 md:p-8 rounded-[30px] shadow-lg w-full max-w-md flex flex-col items-center"
                    >
                        {/* Icon */}
                        <div className="bg-blue-100 rounded-2xl p-4 mb-4 border-2 border-white shadow-sm">
                            <AccountCircleIcon style={{ fontSize: 48, color: '#3B82F6' }} />
                        </div>

                        {/* Title */}
                        <h2 className="text-3xl font-bold text-black mb-1 font-sans">
                            Log In
                        </h2>
                        <p className="text-gray-500 text-xs mb-4 tracking-wider">
                            セキュアなJWT認証システム
                        </p>

                        {/* Form */}
                        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-3">

                            {/* Email */}
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-black pl-1 block">メールアドレス / ユーザー名</label>
                                <input
                                    type="text"
                                    {...register('email')}
                                    placeholder="your@email.com またはユーザー名"
                                    className={`w-full bg-[#BFBFBF] bg-opacity-50 border ${errors.email ? 'border-red-500' : 'border-gray-400'} rounded-lg px-4 py-3 placeholder-gray-500 text-black focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-colors`}
                                />
                                <AnimatePresence>
                                    {errors.email && (
                                        <motion.p
                                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                            className="text-red-500 text-xs mt-1 pl-1"
                                        >
                                            {errors.email.message}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Password */}
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-black pl-1 block">パスワード</label>
                                <input
                                    type="password"
                                    {...register('password')}
                                    placeholder="パスワードを入力"
                                    className={`w-full bg-[#BFBFBF] bg-opacity-50 border ${errors.password ? 'border-red-500' : 'border-gray-400'} rounded-lg px-4 py-3 placeholder-gray-500 text-black focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-colors`}
                                />
                                <AnimatePresence>
                                    {errors.password && (
                                        <motion.p
                                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                            className="text-red-500 text-xs mt-1 pl-1"
                                        >
                                            {errors.password.message}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Error Box */}
                            {errorMessage && (
                                <div className="bg-red-100 text-red-600 text-xs p-2 rounded text-center border border-red-200">
                                    {errorMessage}
                                </div>
                            )}

                            {/* Main Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-[#1E90FF] hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            >
                                {isSubmitting ? '処理中...' : 'ログイン'}
                            </button>

                            {/* Create Account Link */}
                            <div className="text-center pt-2">
                                <button
                                    type="button"
                                    onClick={() => navigate('/signup')}
                                    className="text-[#1E90FF] text-sm font-bold hover:underline"
                                >
                                    新規アカウント作成
                                </button>
                            </div>

                            {/* Divider */}
                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-gray-400 opacity-50"></div>
                                <span className="flex-shrink-0 mx-4 text-gray-500 text-xs">または</span>
                                <div className="flex-grow border-t border-gray-400 opacity-50"></div>
                            </div>

                            {/* Future Implementations */}
                            <p className="text-center text-[10px] text-gray-500 -mt-2">将来実装予定</p>

                            {/* Social Buttons (Disabled) */}
                            <div className="space-y-3">
                                <button type="button" disabled className="w-full bg-[#C0C0C0] text-gray-600 font-bold py-3 px-4 rounded-lg text-sm border border-gray-400 flex items-center justify-center opacity-70 cursor-not-allowed">
                                    <span className="mr-2 font-serif font-black">G</span> Googleでログイン
                                </button>
                                <button type="button" disabled className="w-full bg-[#C0C0C0] text-gray-600 font-bold py-3 px-4 rounded-lg text-sm border border-gray-400 flex items-center justify-center opacity-70 cursor-not-allowed">
                                    Appleでログイン
                                </button>
                            </div>

                        </form>

                        {/* Footer Note */}
                        <div className="mt-4 pt-4 border-t border-gray-400 border-opacity-30 w-full text-center">
                            <p className="text-[10px] text-gray-500">
                                JWT（JSON Web Token）による安全な認証
                            </p>
                        </div>
                    </motion.div>
                </div>

            </main>
        </div>
    );
};

export default LoginPage;
