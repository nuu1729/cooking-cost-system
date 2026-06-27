import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserMultiFormatReader } from '@zxing/browser';

interface Props {
    onDetected: (productName: string, barcode: string) => void;
    onClose: () => void;
}

async function lookupProductName(barcode: string): Promise<string | null> {
    try {
        const res = await fetch(
            `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
            { signal: AbortSignal.timeout(5000) }
        );
        const json = await res.json();
        if (json.status !== 1) return null;
        const product = json.product;
        // 日本語名を優先、なければ英語名
        return product.product_name_ja || product.product_name || null;
    } catch {
        return null;
    }
}

const BarcodeScanner: React.FC<Props> = ({ onDetected, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const readerRef = useRef<BrowserMultiFormatReader | null>(null);
    const detectedRef = useRef(false);
    const [status, setStatus] = useState<'scanning' | 'looking_up' | 'error'>('scanning');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        reader
            .decodeFromVideoDevice(undefined, videoRef.current!, async (result, error) => {
                if (!result || detectedRef.current) return;
                if (error && (error as Error).name !== 'NotFoundException') return;
                if (!result) return;

                detectedRef.current = true;
                const barcode = result.getText();
                setStatus('looking_up');

                const name = await lookupProductName(barcode);
                BrowserMultiFormatReader.releaseAllStreams();
                onDetected(name ?? barcode, barcode);
            })
            .catch(() => {
                setStatus('error');
                setErrorMsg('カメラへのアクセスが拒否されました。ブラウザの設定を確認してください。');
            });

        return () => {
            BrowserMultiFormatReader.releaseAllStreams();
        };
    }, [onDetected]);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5V16M4 8h4m8-4h4M4 4h4v4H4V4zm12 0h4v4h-4V4zM4 16h4v4H4v-4z" />
                                </svg>
                            </div>
                            <span className="font-bold text-gray-800">バーコードをスキャン</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    {/* Camera / Status */}
                    {status === 'error' ? (
                        <div className="p-8 text-center space-y-3">
                            <div className="text-4xl">📷</div>
                            <p className="text-red-600 text-sm font-medium">{errorMsg}</p>
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-gray-100 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200 transition"
                            >
                                閉じる
                            </button>
                        </div>
                    ) : status === 'looking_up' ? (
                        <div className="p-12 text-center space-y-4">
                            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-gray-600 text-sm font-medium">商品情報を検索中...</p>
                        </div>
                    ) : (
                        <div className="relative bg-black">
                            <video
                                ref={videoRef}
                                className="w-full aspect-video object-cover"
                                muted
                                playsInline
                            />
                            {/* Viewfinder overlay */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="relative w-56 h-28">
                                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-orange-400 rounded-tl" />
                                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-orange-400 rounded-tr" />
                                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-orange-400 rounded-bl" />
                                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-orange-400 rounded-br" />
                                    <motion.div
                                        animate={{ y: ['0%', '100%', '0%'] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                        className="absolute left-1 right-1 h-0.5 bg-orange-400 opacity-80"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {status === 'scanning' && (
                        <p className="text-xs text-gray-400 text-center py-3 px-4">
                            バーコードを枠内に合わせてください
                        </p>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default BarcodeScanner;
