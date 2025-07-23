import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // リクエスト情報をログ出力
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
  });

  // レスポンス完了時の処理
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[level](`${req.method} ${req.originalUrl} ${res.statusCode}`, {
      duration: `${duration}ms`,
      statusCode: res.statusCode,
      contentLength: res.get('Content-Length'),
    });
  });

  next();
};

export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Request Error:', {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  
  next(error);
};
