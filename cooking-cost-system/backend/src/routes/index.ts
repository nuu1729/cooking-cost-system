import { Router } from 'express';
import ingredientsRouter from './ingredients';
import dishesRouter from './dishes';
import completedFoodsRouter from './completedFoods';
import reportsRouter from './reports';
import memoRouter from './memo';
import uploadRouter from './upload';
import authRouter from './auth';

const router = Router();

// API ルートの統合
router.use('/ingredients', ingredientsRouter);
router.use('/dishes', dishesRouter);
router.use('/foods', completedFoodsRouter);
router.use('/reports', reportsRouter);
router.use('/memo', memoRouter);
router.use('/upload', uploadRouter);
router.use('/auth', authRouter);

// API情報エンドポイント
router.get('/', (req, res) => {
    res.json({
        name: '🍽️ 料理原価計算システム API v2.0',
        version: '2.0.0',
        description: 'モダンな料理原価計算システムのREST API',
        endpoints: {
            ingredients: '/api/ingredients - 食材管理',
            dishes: '/api/dishes - 料理管理',
            completedFoods: '/api/foods - 完成品管理',
            reports: '/api/reports - レポート・統計',
            memo: '/api/memo - メモ機能',
            upload: '/api/upload - ファイルアップロード',
            auth: '/api/auth - 認証（将来用）',
        },
        features: [
            'RESTful API設計',
            'TypeScript完全対応',
            'リアルタイム原価計算',
            '統計・分析機能',
            'ファイルアップロード',
            'レート制限',
            'エラーハンドリング',
            'ログ出力',
        ],
        status: 'active',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
    });
});

export default router;