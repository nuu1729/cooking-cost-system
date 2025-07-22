import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import { asyncHandler, BadRequestError } from '../middleware/errorHandler';
import { uploadRateLimit } from '../middleware/rateLimit';
import { logger } from '../utils/logger';

const router = Router();

// アップロード設定
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads');
        
        try {
            await fs.access(uploadDir);
        } catch {
            await fs.mkdir(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
        files: 5,
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|xlsx|csv|json/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images, PDFs, Excel, and CSV files are allowed'));
        }
    }
});

// POST /api/upload/single - 単一ファイルアップロード
router.post('/single', 
    uploadRateLimit,
    upload.single('file'),
    asyncHandler(async (req: Request, res: Response) => {
        if (!req.file) {
            throw new BadRequestError('No file uploaded');
        }

        const fileInfo = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            path: req.file.path,
            url: `/uploads/${req.file.filename}`,
        };

        logger.info(`File uploaded: ${req.file.originalname}`, fileInfo);

        res.json({
            success: true,
            data: fileInfo,
            message: 'File uploaded successfully',
            timestamp: new Date().toISOString(),
        });
    })
);

// POST /api/upload/multiple - 複数ファイルアップロード
router.post('/multiple',
    uploadRateLimit,
    upload.array('files', 5),
    asyncHandler(async (req: Request, res: Response) => {
        const files = req.files as Express.Multer.File[];
        
        if (!files || files.length === 0) {
            throw new BadRequestError('No files uploaded');
        }

        const filesInfo = files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
            path: file.path,
            url: `/uploads/${file.filename}`,
        }));

        logger.info(`Multiple files uploaded: ${files.length} files`);

        res.json({
            success: true,
            data: filesInfo,
            count: files.length,
            message: 'Files uploaded successfully',
            timestamp: new Date().toISOString(),
        });
    })
);

// DELETE /api/upload/:filename - ファイル削除
router.delete('/:filename', asyncHandler(async (req: Request, res: Response) => {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'uploads', filename);

    try {
        await fs.access(filePath);
        await fs.unlink(filePath);
        
        logger.info(`File deleted: ${filename}`);
        
        res.json({
            success: true,
            message: 'File deleted successfully',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        throw new BadRequestError('File not found or could not be deleted');
    }
}));

// GET /api/upload/list - アップロードファイル一覧
router.get('/list', asyncHandler(async (req: Request, res: Response) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    try {
        const files = await fs.readdir(uploadDir);
        const fileList = await Promise.all(
            files.map(async (filename) => {
                const filePath = path.join(uploadDir, filename);
                const stats = await fs.stat(filePath);
                
                return {
                    filename,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime,
                    url: `/uploads/${filename}`,
                };
            })
        );

        res.json({
            success: true,
            data: fileList,
            count: fileList.length,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        res.json({
            success: true,
            data: [],
            count: 0,
            timestamp: new Date().toISOString(),
        });
    }
}));

export default router;