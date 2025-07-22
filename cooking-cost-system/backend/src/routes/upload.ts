import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { 
    executeQuery, 
    executeQueryOne, 
    executeInsert, 
    executeUpdate 
} from '../database';
import { asyncHandler, validationErrorHandler, NotFoundError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

// バリデーションルール
const updateMemoValidation = [
    body('content')
        .isLength({ max: 10000 })
        .withMessage('メモ内容は10000文字以下で入力してください'),
];

// バリデーションエラーチェック
const checkValidation = (req: Request, res: Response, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw validationErrorHandler(errors.array());
    }
    next();
};

// メモ取得 (GET /api/memo)
router.get('/', asyncHandler(async (req: Request, res: Response) => {
    // メモは1つだけ存在する想定（最新のもの）
    let memo = await executeQueryOne(`
        SELECT 
            id,
            content,
            created_at,
            updated_at
        FROM memos 
        ORDER BY updated_at DESC 
        LIMIT 1
    `);

    // メモが存在しない場合は空のメモを作成
    if (!memo) {
        const insertId = await executeInsert(`
            INSERT INTO memos (content) 
            VALUES (?)
        `, ['']);

        memo = await executeQueryOne(`
            SELECT 
                id,
                content,
                created_at,
                updated_at
            FROM memos 
            WHERE id = ?
        `, [insertId]);
    }

    logger.info('Memo retrieved', {
        id: memo.id,
        contentLength: memo.content?.length || 0
    });

    res.json({
        success: true,
        data: memo,
        timestamp: new Date().toISOString(),
    });
}));

// メモ更新 (PUT /api/memo)
router.put('/', updateMemoValidation, checkValidation, asyncHandler(async (req: Request, res: Response) => {
    const { content } = req.body;

    // 既存のメモを取得
    let existingMemo = await executeQueryOne(`
        SELECT id FROM memos 
        ORDER BY updated_at DESC 
        LIMIT 1
    `);

    let memoId;

    if (existingMemo) {
        // 既存のメモを更新
        const affectedRows = await executeUpdate(`
            UPDATE memos 
            SET content = ?, updated_at = NOW() 
            WHERE id = ?
        `, [content, existingMemo.id]);

        if (affectedRows === 0) {
            throw new Error('メモの更新に失敗しました');
        }

        memoId = existingMemo.id;
    } else {
        // 新しいメモを作成
        memoId = await executeInsert(`
            INSERT INTO memos (content) 
            VALUES (?)
        `, [content]);
    }

    // 更新されたメモを取得
    const updatedMemo = await executeQueryOne(`
        SELECT 
            id,
            content,
            created_at,
            updated_at
        FROM memos 
        WHERE id = ?
    `, [memoId]);

    logger.info('Memo updated', {
        id: memoId,
        contentLength: content?.length || 0,
        action: existingMemo ? 'updated' : 'created'
    });

    res.json({
        success: true,
        data: updatedMemo,
        message: 'メモを保存しました',
        timestamp: new Date().toISOString(),
    });
}));

// メモ履歴取得 (GET /api/memo/history)
router.get('/history', asyncHandler(async (req: Request, res: Response) => {
    const { limit = 10 } = req.query;

    const memoHistory = await executeQuery(`
        SELECT 
            id,
            LEFT(content, 100) as preview,
            LENGTH(content) as content_length,
            created_at,
            updated_at
        FROM memos 
        ORDER BY updated_at DESC 
        LIMIT ?
    `, [Number(limit)]);

    res.json({
        success: true,
        data: memoHistory,
        timestamp: new Date().toISOString(),
    });
}));

// 特定のメモ履歴取得 (GET /api/memo/history/:id)
router.get('/history/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const memo = await executeQueryOne(`
        SELECT 
            id,
            content,
            created_at,
            updated_at
        FROM memos 
        WHERE id = ?
    `, [id]);

    if (!memo) {
        throw new NotFoundError('指定されたメモが見つかりません');
    }

    res.json({
        success: true,
        data: memo,
        timestamp: new Date().toISOString(),
    });
}));

// メモ統計情報取得 (GET /api/memo/stats)
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
    const stats = await executeQueryOne(`
        SELECT 
            COUNT(*) as total_memos,
            AVG(LENGTH(content)) as avg_content_length,
            MAX(LENGTH(content)) as max_content_length,
            MIN(updated_at) as oldest_memo,
            MAX(updated_at) as latest_memo
        FROM memos
    `);

    // 月別のメモ更新回数
    const monthlyUpdates = await executeQuery(`
        SELECT 
            DATE_FORMAT(updated_at, '%Y-%m') as month,
            COUNT(*) as update_count,
            AVG(LENGTH(content)) as avg_length
        FROM memos
        WHERE updated_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(updated_at, '%Y-%m')
        ORDER BY month DESC
    `);

    // 文字数分布
    const lengthDistribution = await executeQuery(`
        SELECT 
            CASE 
                WHEN LENGTH(content) = 0 THEN '空'
                WHEN LENGTH(content) <= 100 THEN '短い(1-100文字)'
                WHEN LENGTH(content) <= 500 THEN '中程度(101-500文字)'
                WHEN LENGTH(content) <= 1000 THEN '長い(501-1000文字)'
                ELSE '非常に長い(1000文字以上)'
            END as length_category,
            COUNT(*) as count
        FROM memos
        GROUP BY length_category
        ORDER BY 
            CASE length_category
                WHEN '空' THEN 1
                WHEN '短い(1-100文字)' THEN 2
                WHEN '中程度(101-500文字)' THEN 3
                WHEN '長い(501-1000文字)' THEN 4
                WHEN '非常に長い(1000文字以上)' THEN 5
            END
    `);

    res.json({
        success: true,
        data: {
            stats,
            monthlyUpdates,
            lengthDistribution
        },
        timestamp: new Date().toISOString(),
    });
}));

// メモバックアップ (POST /api/memo/backup)
router.post('/backup', asyncHandler(async (req: Request, res: Response) => {
    // 現在のメモの内容を取得
    const currentMemo = await executeQueryOne(`
        SELECT content FROM memos 
        ORDER BY updated_at DESC 
        LIMIT 1
    `);

    if (!currentMemo) {
        throw new NotFoundError('バックアップするメモが見つかりません');
    }

    // バックアップとして新しいメモエントリを作成
    const backupId = await executeInsert(`
        INSERT INTO memos (content) 
        VALUES (?)
    `, [currentMemo.content]);

    const backup = await executeQueryOne(`
        SELECT 
            id,
            content,
            created_at
        FROM memos 
        WHERE id = ?
    `, [backupId]);

    logger.info('Memo backup created', {
        backupId,
        contentLength: currentMemo.content?.length || 0
    });

    res.json({
        success: true,
        data: backup,
        message: 'メモのバックアップを作成しました',
        timestamp: new Date().toISOString(),
    });
}));

// メモ復元 (POST /api/memo/restore/:id)
router.post('/restore/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // 復元するメモを取得
    const restoreMemo = await executeQueryOne(`
        SELECT content FROM memos WHERE id = ?
    `, [id]);

    if (!restoreMemo) {
        throw new NotFoundError('復元するメモが見つかりません');
    }

    // 現在のメモを更新
    const currentMemo = await executeQueryOne(`
        SELECT id FROM memos 
        ORDER BY updated_at DESC 
        LIMIT 1
    `);

    let resultId;

    if (currentMemo) {
        // 既存のメモを更新
        await executeUpdate(`
            UPDATE memos 
            SET content = ?, updated_at = NOW() 
            WHERE id = ?
        `, [restoreMemo.content, currentMemo.id]);
        resultId = currentMemo.id;
    } else {
        // 新しいメモを作成
        resultId = await executeInsert(`
            INSERT INTO memos (content) 
            VALUES (?)
        `, [restoreMemo.content]);
    }

    const restoredMemo = await executeQueryOne(`
        SELECT 
            id,
            content,
            created_at,
            updated_at
        FROM memos 
        WHERE id = ?
    `, [resultId]);

    logger.info('Memo restored', {
        restoredFromId: id,
        currentId: resultId,
        contentLength: restoreMemo.content?.length || 0
    });

    res.json({
        success: true,
        data: restoredMemo,
        message: 'メモを復元しました',
        timestamp: new Date().toISOString(),
    });
}));

// 古いメモの削除 (DELETE /api/memo/cleanup)
router.delete('/cleanup', asyncHandler(async (req: Request, res: Response) => {
    const { keepDays = 90 } = req.query;

    // 最新の1件は保持し、指定日数より古いメモを削除
    const deletedCount = await executeUpdate(`
        DELETE FROM memos 
        WHERE id NOT IN (
            SELECT id FROM (
                SELECT id FROM memos 
                ORDER BY updated_at DESC 
                LIMIT 1
            ) as latest_memo
        )
        AND updated_at < DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [Number(keepDays)]);

    logger.info('Old memos cleaned up', {
        deletedCount,
        keepDays: Number(keepDays)
    });

    res.json({
        success: true,
        data: {
            deletedCount,
            keepDays: Number(keepDays)
        },
        message: `${deletedCount}件の古いメモを削除しました`,
        timestamp: new Date().toISOString(),
    });
}));

export default router;