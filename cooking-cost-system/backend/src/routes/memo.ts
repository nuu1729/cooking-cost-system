import { Router, Request, Response } from 'express';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { getDatabase } from '../database';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/memo - メモ取得
router.get('/', asyncHandler(async (req: Request, res: Response) => {
    const db = getDatabase();
    const memos = await db.query('SELECT * FROM memos ORDER BY updated_at DESC');
    
    res.json({
        success: true,
        data: memos,
        timestamp: new Date().toISOString(),
    });
}));

// GET /api/memo/:id - 特定メモ取得
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
        throw new BadRequestError('Invalid memo ID');
    }

    const db = getDatabase();
    const memo = await db.queryOne('SELECT * FROM memos WHERE id = ?', [id]);
    
    if (!memo) {
        throw new NotFoundError('Memo');
    }

    res.json({
        success: true,
        data: memo,
        timestamp: new Date().toISOString(),
    });
}));

// POST /api/memo - メモ作成
router.post('/', asyncHandler(async (req: Request, res: Response) => {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
        throw new BadRequestError('Memo content is required');
    }

    const db = getDatabase();
    const result = await db.query(
        'INSERT INTO memos (content, created_at, updated_at) VALUES (?, NOW(), NOW())',
        [content]
    ) as any;

    const memo = await db.queryOne('SELECT * FROM memos WHERE id = ?', [result.insertId]);

    logger.info(`Created memo with ID: ${result.insertId}`);

    res.status(201).json({
        success: true,
        data: memo,
        message: 'Memo created successfully',
        timestamp: new Date().toISOString(),
    });
}));

// PUT /api/memo/:id - メモ更新
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { content } = req.body;

    if (isNaN(id)) {
        throw new BadRequestError('Invalid memo ID');
    }

    if (!content || content.trim().length === 0) {
        throw new BadRequestError('Memo content is required');
    }

    const db = getDatabase();
    
    // メモの存在確認
    const existingMemo = await db.queryOne('SELECT * FROM memos WHERE id = ?', [id]);
    if (!existingMemo) {
        throw new NotFoundError('Memo');
    }

    await db.query(
        'UPDATE memos SET content = ?, updated_at = NOW() WHERE id = ?',
        [content, id]
    );

    const memo = await db.queryOne('SELECT * FROM memos WHERE id = ?', [id]);

    logger.info(`Updated memo with ID: ${id}`);

    res.json({
        success: true,
        data: memo,
        message: 'Memo updated successfully',
        timestamp: new Date().toISOString(),
    });
}));

// DELETE /api/memo/:id - メモ削除
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        throw new BadRequestError('Invalid memo ID');
    }

    const db = getDatabase();
    
    // メモの存在確認
    const existingMemo = await db.queryOne('SELECT * FROM memos WHERE id = ?', [id]);
    if (!existingMemo) {
        throw new NotFoundError('Memo');
    }

    await db.query('DELETE FROM memos WHERE id = ?', [id]);

    logger.info(`Deleted memo with ID: ${id}`);

    res.json({
        success: true,
        message: 'Memo deleted successfully',
        timestamp: new Date().toISOString(),
    });
}));

export default router;