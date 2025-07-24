import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// ================================
// メトリクス収集クラス
// ================================

class MetricsCollector {
    private static instance: MetricsCollector;
    private metrics: Map<string, any>;
    private startTime: number;

    private constructor() {
        this.metrics = new Map();
        this.startTime = Date.now();
        this.initializeMetrics();
    }

    public static getInstance(): MetricsCollector {
        if (!MetricsCollector.instance) {
            MetricsCollector.instance = new MetricsCollector();
        }
        return MetricsCollector.instance;
    }

    private initializeMetrics(): void {
        // HTTP リクエストメトリクス
        this.metrics.set('http_requests_total', {
            type: 'counter',
            help: 'Total number of HTTP requests',
            value: new Map<string, number>(),
        });

        this.metrics.set('http_request_duration_seconds', {
            type: 'histogram',
            help: 'HTTP request duration in seconds',
            buckets: [0.1, 0.5, 1, 2, 5, 10],
            value: new Map<string, Array<{ bucket: number; count: number }>>(),
        });

        this.metrics.set('http_requests_in_flight', {
            type: 'gauge',
            help: 'Number of HTTP requests currently being processed',
            value: 0,
        });

        // アプリケーションメトリクス
        this.metrics.set('app_uptime_seconds', {
            type: 'gauge',
            help: 'Application uptime in seconds',
            value: 0,
        });

        this.metrics.set('nodejs_memory_usage_bytes', {
            type: 'gauge',
            help: 'Node.js memory usage in bytes',
            value: new Map<string, number>(),
        });

        this.metrics.set('nodejs_cpu_usage_percent', {
            type: 'gauge',
            help: 'Node.js CPU usage percentage',
            value: 0,
        });

        // データベースメトリクス
        this.metrics.set('database_connections_active', {
            type: 'gauge',
            help: 'Number of active database connections',
            value: 0,
        });

        this.metrics.set('database_query_duration_seconds', {
            type: 'histogram',
            help: 'Database query duration in seconds',
            buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
            value: new Map<string, Array<{ bucket: number; count: number }>>(),
        });

        this.metrics.set('database_queries_total', {
            type: 'counter',
            help: 'Total number of database queries',
            value: new Map<string, number>(),
        });

        // ビジネスメトリクス
        this.metrics.set('ingredients_total', {
            type: 'gauge',
            help: 'Total number of ingredients',
            value: 0,
        });

        this.metrics.set('dishes_total', {
            type: 'gauge',
            help: 'Total number of dishes',
            value: 0,
        });

        this.metrics.set('completed_foods_total', {
            type: 'gauge',
            help: 'Total number of completed foods',
            value: 0,
        });

        this.metrics.set('api_errors_total', {
            type: 'counter',
            help: 'Total number of API errors',
            value: new Map<string, number>(),
        });
    }

    // カウンターメトリクスの増加
    public incrementCounter(name: string, labels: Record<string, string> = {}): void {
        const metric = this.metrics.get(name);
        if (!metric || metric.type !== 'counter') return;

        const labelKey = this.getLabelKey(labels);
        const current = metric.value.get(labelKey) || 0;
        metric.value.set(labelKey, current + 1);
    }

    // ゲージメトリクスの設定
    public setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
        const metric = this.metrics.get(name);
        if (!metric || metric.type !== 'gauge') return;

        if (Object.keys(labels).length === 0) {
            metric.value = value;
        } else {
            const labelKey = this.getLabelKey(labels);
            if (typeof metric.value === 'object' && metric.value instanceof Map) {
                metric.value.set(labelKey, value);
            }
        }
    }

    // ヒストグラムメトリクスの観測
    public observeHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
        const metric = this.metrics.get(name);
        if (!metric || metric.type !== 'histogram') return;

        const labelKey = this.getLabelKey(labels);
        if (!metric.value.has(labelKey)) {
            metric.value.set(labelKey, metric.buckets.map((bucket: number) => ({
                bucket,
                count: 0,
            })));
        }

        const buckets = metric.value.get(labelKey);
        buckets.forEach((bucket: any) => {
            if (value <= bucket.bucket) {
                bucket.count++;
            }
        });
    }

    // ラベルキーの生成
    private getLabelKey(labels: Record<string, string>): string {
        return Object.entries(labels)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}="${value}"`)
            .join(',');
    }

    // Prometheus形式での出力
    public getPrometheusMetrics(): string {
        const lines: string[] = [];

        this.updateSystemMetrics();

        this.metrics.forEach((metric, name) => {
            lines.push(`# HELP ${name} ${metric.help}`);
            lines.push(`# TYPE ${name} ${metric.type}`);

            if (metric.type === 'counter' || (metric.type === 'gauge' && metric.value instanceof Map)) {
                metric.value.forEach((value: number, labels: string) => {
                    const labelStr = labels ? `{${labels}}` : '';
                    lines.push(`${name}${labelStr} ${value}`);
                });
            } else if (metric.type === 'gauge' && typeof metric.value === 'number') {
                lines.push(`${name} ${metric.value}`);
            } else if (metric.type === 'histogram') {
                metric.value.forEach((buckets: any[], labels: string) => {
                    const labelStr = labels ? `{${labels},` : '{';
                    let totalCount = 0;

                    buckets.forEach((bucket) => {
                        totalCount += bucket.count;
                        lines.push(`${name}_bucket${labelStr}le="${bucket.bucket}"} ${totalCount}`);
                    });

                    lines.push(`${name}_bucket${labelStr}le="+Inf"} ${totalCount}`);
                    lines.push(`${name}_count${labels ? `{${labels}}` : ''} ${totalCount}`);
                });
            }

            lines.push('');
        });

        return lines.join('\n');
    }

    // システムメトリクスの更新
    private updateSystemMetrics(): void {
        // アップタイム
        this.setGauge('app_uptime_seconds', Math.floor((Date.now() - this.startTime) / 1000));

        // メモリ使用量
        const memUsage = process.memoryUsage();
        this.setGauge('nodejs_memory_usage_bytes', memUsage.heapUsed, { type: 'heap_used' });
        this.setGauge('nodejs_memory_usage_bytes', memUsage.heapTotal, { type: 'heap_total' });
        this.setGauge('nodejs_memory_usage_bytes', memUsage.rss, { type: 'rss' });
        this.setGauge('nodejs_memory_usage_bytes', memUsage.external, { type: 'external' });

        // CPU使用量（簡易版）
        const cpuUsage = process.cpuUsage();
        const totalCpuTime = cpuUsage.user + cpuUsage.system;
        this.setGauge('nodejs_cpu_usage_percent', totalCpuTime / 1000000); // マイクロ秒を秒に変換
    }

    // 全メトリクスの取得
    public getAllMetrics(): Record<string, any> {
        this.updateSystemMetrics();
        const result: Record<string, any> = {};
        
        this.metrics.forEach((metric, name) => {
            result[name] = {
                type: metric.type,
                help: metric.help,
                value: metric.value instanceof Map ? Object.fromEntries(metric.value) : metric.value,
            };
        });

        return result;
    }

    // メトリクスのリセット
    public reset(): void {
        this.metrics.clear();
        this.initializeMetrics();
    }
}

// ================================
// ミドルウェア関数
// ================================

export const metricsCollector = MetricsCollector.getInstance();

// HTTPリクエストメトリクス収集ミドルウェア
export const collectHttpMetrics = (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    const labels = {
        method: req.method,
        route: req.route?.path || req.path,
        status_code: '',
    };

    // 進行中のリクエスト数を増加
    const currentInFlight = metricsCollector.getAllMetrics().http_requests_in_flight?.value || 0;
    metricsCollector.setGauge('http_requests_in_flight', currentInFlight + 1);

    // レスポンス完了時の処理
    res.on('finish', () => {
        const duration = (Date.now() - startTime) / 1000;
        labels.status_code = res.statusCode.toString();

        // メトリクス更新
        metricsCollector.incrementCounter('http_requests_total', labels);
        metricsCollector.observeHistogram('http_request_duration_seconds', duration, labels);
        
        // 進行中のリクエスト数を減少
        const newInFlight = metricsCollector.getAllMetrics().http_requests_in_flight?.value || 1;
        metricsCollector.setGauge('http_requests_in_flight', Math.max(0, newInFlight - 1));

        // エラーログ
        if (res.statusCode >= 400) {
            metricsCollector.incrementCounter('api_errors_total', {
                status_code: res.statusCode.toString(),
                method: req.method,
            });

            logger.warn('HTTP Error Metric', {
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                duration,
                userAgent: req.get('User-Agent'),
                ip: req.ip,
            });
        }
    });

    next();
};

// データベースクエリメトリクス
export const collectDatabaseMetrics = (operation: string, duration: number, success: boolean): void => {
    const labels = {
        operation,
        status: success ? 'success' : 'error',
    };

    metricsCollector.incrementCounter('database_queries_total', labels);
    metricsCollector.observeHistogram('database_query_duration_seconds', duration / 1000, labels);

    if (!success) {
        logger.warn('Database Error Metric', {
            operation,
            duration,
            timestamp: new Date().toISOString(),
        });
    }
};

// ビジネスメトリクスの更新
export const updateBusinessMetrics = async (): Promise<void> => {
    try {
        // 実際の実装では、データベースから各テーブルの件数を取得
        // const ingredientCount = await Ingredient.count();
        // const dishCount = await Dish.count();
        // const completedFoodCount = await CompletedFood.count();

        // サンプル値（実装時は実際のカウントに置き換え）
        metricsCollector.setGauge('ingredients_total', 50);
        metricsCollector.setGauge('dishes_total', 25);
        metricsCollector.setGauge('completed_foods_total', 10);

        logger.debug('Business metrics updated');
    } catch (error) {
        logger.error('Failed to update business metrics:', error);
    }
};

// ヘルスチェック用メトリクス
export const getHealthMetrics = (): Record<string, any> => {
    const metrics = metricsCollector.getAllMetrics();
    
    return {
        uptime: metrics.app_uptime_seconds?.value || 0,
        memory: {
            heapUsed: metrics.nodejs_memory_usage_bytes?.value?.['type="heap_used"'] || 0,
            heapTotal: metrics.nodejs_memory_usage_bytes?.value?.['type="heap_total"'] || 0,
            rss: metrics.nodejs_memory_usage_bytes?.value?.['type="rss"'] || 0,
        },
        requests: {
            total: Object.values(metrics.http_requests_total?.value || {}).reduce((a: any, b: any) => a + b, 0),
            inFlight: metrics.http_requests_in_flight?.value || 0,
            errors: Object.values(metrics.api_errors_total?.value || {}).reduce((a: any, b: any) => a + b, 0),
        },
        database: {
            activeConnections: metrics.database_connections_active?.value || 0,
            queryCount: Object.values(metrics.database_queries_total?.value || {}).reduce((a: any, b: any) => a + b, 0),
        },
    };
};

// メトリクス定期更新タスク
setInterval(async () => {
    await updateBusinessMetrics();
}, 60000); // 1分ごと

export default {
    metricsCollector,
    collectHttpMetrics,
    collectDatabaseMetrics,
    updateBusinessMetrics,
    getHealthMetrics,
};
