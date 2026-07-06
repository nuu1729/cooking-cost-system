import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { signinApi } from '@/api';
import { accountStore } from '@/stores/accountStore';
import { toBackendUrl } from '@/utils/url';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

// Validation Schema
const schema = yup.object({
    name: yup
        .string()
        .required('お名前は必須です'),
    email: yup
        .string()
        .email('有効なメールアドレスを入力してください')
        .required('メールアドレスは必須です'),
    password: yup
        .string()
        .required('パスワードは必須です')
        .min(8, 'パスワードは8文字以上で入力してください')
        .test('password-has-lower', 'パスワードに小文字英字を含めてください', (v) => !v || /[a-z]/.test(v))
        .test('password-has-upper', 'パスワードに大文字英字を含めてください', (v) => !v || /[A-Z]/.test(v))
        .test('password-has-digit', 'パスワードに数字を含めてください', (v) => !v || /[0-9]/.test(v)),
    confirmPassword: yup
        .string()
        .required('パスワード（確認）は必須です')
        .oneOf([yup.ref('password')], 'パスワードが一致しません'),
}).required();

type FormData = yup.InferType<typeof schema>;

const SignupPage: React.FC = () => {
    const navigate = useNavigate();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isTermsOpen, setIsTermsOpen] = useState(false);
    const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
    
    // Password Visibility State
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // Confirmation Modal State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [pendingData, setPendingData] = useState<FormData | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        resolver: yupResolver(schema),
        mode: 'onBlur',
    });

    const onFormSubmit = (data: FormData) => {
        setErrorMessage(null);
        setPendingData(data);
        setIsConfirmOpen(true);
    };

    const handleFinalSubmit = async () => {
        if (!pendingData) return;

        try {
            const response = await signinApi.register({
                username: pendingData.name,
                email: pendingData.email,
                password: pendingData.password
            });
            if (response.success && response.data) {
                const data = response.data as any;
                localStorage.setItem('authToken', data.token);
                accountStore.initForUser(data.user.id, data.user.username, data.user.email, toBackendUrl(data.user.icon_url), toBackendUrl(data.user.home_bg_url));
                setIsConfirmOpen(false);
                navigate('/');
            }
        } catch (err: any) {
            setIsConfirmOpen(false);
            const status = err?.response?.status;
            const message = err?.response?.data?.message;
            if (status === 409) {
                setErrorMessage(`${message || 'このユーザー名またはメールアドレスは既に登録されています。'} → ログインページからサインインしてください。`);
            } else {
                setErrorMessage(message || 'アカウント作成に失敗しました。時間をおいて再度お試しください。');
            }
        }
    };

    return (
        // min-h-screen-dvh + overflow-hidden なし:
        // コンテンツがビューポートより高い場合（モバイル等）は下部が切れずにスクロールできる
        <div className="min-h-screen-dvh w-full bg-white flex flex-col font-sans text-gray-800">
            {/* Header */}
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
                        アカウント作成
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
                            Sign Up
                        </h2>
                        <p className="text-gray-500 text-xs mb-3 tracking-wider">
                            新規アカウントを作成して利用を開始
                        </p>

                        {/* Form */}
                        <form onSubmit={handleSubmit(onFormSubmit)} className="w-full space-y-2">

                            {/* Name */}
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-black pl-1 block">お名前</label>
                                <input
                                    type="text"
                                    {...register('name')}
                                    placeholder="山田 太郎"
                                    className={`w-full bg-[#BFBFBF] bg-opacity-50 border ${errors.name ? 'border-red-500' : 'border-gray-400'} rounded-lg px-4 py-3 placeholder-gray-500 text-black focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-colors`}
                                />
                                <AnimatePresence>
                                    {errors.name && (
                                        <motion.p
                                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                            className="text-red-500 text-xs mt-1 pl-1"
                                        >
                                            {errors.name.message}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Email */}
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-black pl-1 block">メールアドレス</label>
                                <input
                                    type="email"
                                    {...register('email')}
                                    placeholder="your@email.com"
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
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        {...register('password')}
                                        placeholder="8文字以上（大文字・小文字・数字を含む）"
                                        className={`w-full bg-[#BFBFBF] bg-opacity-50 border ${errors.password ? 'border-red-500' : 'border-gray-400'} rounded-lg px-4 py-3 pr-10 placeholder-gray-500 text-black focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-colors`}
                                    />
                                    <button
                                        type="button"
                                        onMouseDown={() => setShowPassword(true)}
                                        onMouseUp={() => setShowPassword(false)}
                                        onMouseLeave={() => setShowPassword(false)}
                                        className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-600 focus:outline-none"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <Visibility /> : <VisibilityOff />}
                                    </button>
                                </div>
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

                            {/* Confirm Password */}
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-black pl-1 block">パスワード（確認）</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        {...register('confirmPassword')}
                                        placeholder="パスワードを再入力"
                                        className={`w-full bg-[#BFBFBF] bg-opacity-50 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-400'} rounded-lg px-4 py-3 pr-10 placeholder-gray-500 text-black focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-colors`}
                                    />
                                    <button
                                        type="button"
                                        onMouseDown={() => setShowConfirmPassword(true)}
                                        onMouseUp={() => setShowConfirmPassword(false)}
                                        onMouseLeave={() => setShowConfirmPassword(false)}
                                        className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-600 focus:outline-none"
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? <Visibility /> : <VisibilityOff />}
                                    </button>
                                </div>
                                <AnimatePresence>
                                    {errors.confirmPassword && (
                                        <motion.p
                                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                            className="text-red-500 text-xs mt-1 pl-1"
                                        >
                                            {errors.confirmPassword.message}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>
                            
                            {/* Terms and Privacy Links */}
                            <div className="text-xs text-gray-500 text-center">
                                アカウントを作成することで、
                                <button type="button" onClick={() => setIsTermsOpen(true)} className="text-[#1E90FF] hover:underline mx-1">
                                    利用規約
                                </button>
                                と
                                <button type="button" onClick={() => setIsPrivacyOpen(true)} className="text-[#1E90FF] hover:underline mx-1">
                                    プライバシーポリシー
                                </button>
                                に同意したものとみなされます。
                            </div>

                            {/* Error Box */}
                            {errorMessage && (
                                <div className="bg-red-100 text-red-600 text-xs p-3 rounded border border-red-200 space-y-2">
                                    <p className="text-center">{errorMessage}</p>
                                    <div className="text-center">
                                        <button
                                            type="button"
                                            onClick={() => navigate('/login')}
                                            className="text-[#1E90FF] font-bold hover:underline text-xs"
                                        >
                                            ログインページへ →
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-[#1E90FF] hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            >
                                アカウント作成
                            </button>

                            {/* Back to Login Link */}
                            <div className="text-center pt-2">
                                <span className="text-gray-500 text-sm">すでにアカウントをお持ちですか？ </span>
                                <button
                                    type="button"
                                    onClick={() => navigate('/login')}
                                    className="text-[#1E90FF] text-sm font-bold hover:underline"
                                >
                                    ログイン
                                </button>
                            </div>

                        </form>
                    </motion.div>
                </div>
            </main>

            {/* Modals */}
            <Modal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} title="利用規約">
                <p>ここに利用規約の全文が表示されます。</p>
                <p className="mt-2 text-gray-400">（ダミーテキスト：当サービスを利用するには...）</p>
                <p className="mt-2 text-gray-400">Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
            </Modal>
            
            <Modal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} title="プライバシーポリシー">
                <p>ここにプライバシーポリシーの全文が表示されます。</p>
                <p className="mt-2 text-gray-400">（ダミーテキスト：当サービスは個人情報を適切に...）</p>
                <p className="mt-2 text-gray-400">Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
            </Modal>

            {/* Confirmation Modal */}
            {isConfirmOpen && pendingData && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
                 <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl relative">
                     <button onClick={() => setIsConfirmOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-black">
                         ✕
                     </button>
                     <h3 className="text-xl font-bold mb-6 text-center">アカウント作成の確認</h3>
                     
                     <div className="space-y-4 text-sm text-gray-700">
                         <div className="border-b pb-2">
                             <p className="text-xs text-gray-500 mb-1">お名前</p>
                             <p className="font-semibold text-lg">{pendingData.name}</p>
                         </div>
                         <div className="border-b pb-2">
                             <p className="text-xs text-gray-500 mb-1">メールアドレス</p>
                             <p className="font-semibold text-lg">{pendingData.email}</p>
                         </div>
                         <div className="border-b pb-2">
                             <p className="text-xs text-gray-500 mb-1">パスワード</p>
                             {/* Display Password explicitly in confirmation */}
                             <p className="font-semibold text-lg tracking-widest">{pendingData.password}</p>
                         </div>
                     </div>
     
                     <p className="mt-6 text-xs text-red-500 text-center">
                         ※内容に間違いがないかご確認ください
                     </p>
     
                     <div className="mt-6 flex flex-col space-y-3">
                         <button
                             onClick={handleFinalSubmit}
                             className="w-full bg-[#1E90FF] text-white font-bold py-3 rounded-lg hover:bg-blue-600 transition-colors shadow-md"
                         >
                             この内容でアカウントを作成する
                         </button>
                         <button
                             onClick={() => setIsConfirmOpen(false)}
                             className="w-full bg-gray-200 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-300 transition-colors"
                         >
                             キャンセル
                         </button>
                     </div>
                 </div>
             </div>
            )}
        </div>
    );
};

// Simple Modal Component
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-black">
                    ✕
                </button>
                <h3 className="text-xl font-bold mb-4">{title}</h3>
                <div className="text-sm text-gray-700 max-h-60 overflow-y-auto">
                    {children}
                </div>
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-[#1E90FF] text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                    >
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
