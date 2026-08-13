import React from 'react';
import { useNavigate } from 'react-router-dom';
import { House } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();

    // 配色・タイポグラフィは 00signup / 01login と揃える
    // （bg-white / font-sans / text-gray-800、CTA は #1E90FF）
    //
    // TODO(#186): CTA の #1E90FF は index.css の @theme トークン
    // （--color-primary 等）ではなく直接指定している。移行途中の現時点では
    // 未移行の 00signup / 01login と色が食い違う方が実害が大きいため
    // 既存の配色に合わせているが、全画面の移行完了後にトークンへ寄せること。
    return (
        <div className="min-h-screen-dvh w-full bg-white flex items-center justify-center font-sans text-gray-800 px-4">
            <div className="w-full max-w-sm text-center py-16">
                <h1 className="text-[6rem] leading-none font-bold text-black mb-4">
                    404
                </h1>
                <h2 className="text-3xl font-bold text-black mb-4">
                    ページが見つかりません
                </h2>
                <p className="text-base text-gray-500 mb-8">
                    お探しのページは存在しないか、移動された可能性があります。
                </p>
                {/* size="lg" の高さ(h-9)・アイコン間隔(gap-1.5)は活かしつつ、
                    横paddingだけ px-2.5 → px-6 に広げている（単独CTAとして
                    最小幅を確保するため）。tailwind-merge が後勝ちで解決する */}
                <Button
                    type="button"
                    size="lg"
                    onClick={() => navigate('/')}
                    className="bg-[#1E90FF] text-white hover:bg-blue-600 shadow-md px-6"
                >
                    <House />
                    ホームに戻る
                </Button>
            </div>
        </div>
    );
};

export default NotFoundPage;
