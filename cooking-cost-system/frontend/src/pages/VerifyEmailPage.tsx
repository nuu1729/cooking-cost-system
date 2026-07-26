import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '@/api';

type VerifyState = 'verifying' | 'success' | 'error';

const VerifyEmailPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [state, setState] = useState<VerifyState>('verifying');
    const [message, setMessage] = useState<string>('メールアドレスを確認しています...');

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setState('error');
            setMessage('確認リンクが無効です。');
            return;
        }

        authApi.verifyEmail(token)
            .then((response) => {
                setState('success');
                setMessage(response.message || 'メールアドレスの確認が完了しました。');
            })
            .catch((err: any) => {
                setState('error');
                setMessage(err?.response?.data?.message || '確認リンクが無効、または有効期限が切れています。');
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="min-h-screen-dvh w-full bg-white flex flex-col items-center justify-center font-sans text-gray-800 px-4">
            <div className="bg-[#D9D9D9] p-8 rounded-[30px] shadow-lg w-full max-w-md text-center">
                <h2 className="text-2xl font-bold mb-4">メールアドレスの確認</h2>

                {state === 'verifying' && (
                    <p className="text-sm text-gray-700">{message}</p>
                )}

                {state === 'success' && (
                    <>
                        <p className="text-sm text-green-700 mb-6">{message}</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full bg-[#1E90FF] text-white font-bold py-3 rounded-lg hover:bg-blue-600 transition-colors shadow-md"
                        >
                            ログインページへ
                        </button>
                    </>
                )}

                {state === 'error' && (
                    <>
                        <p className="text-sm text-red-600 mb-6">{message}</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full bg-gray-200 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            ログインページへ戻る
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerifyEmailPage;
