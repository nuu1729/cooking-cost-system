import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';
import { getDatabase } from '../database';

// ================================
// メトリクス収集
// ================================

interface MetricData {
    timestamp: number;
    value: number;
    labels?: Record<string, string>;
}

interface PerformanceMetrics {
    requestCount: Map<string, number>;
    responseTime: Map<string, number[]>;
    errorCount: Map<string, number>;
    databaseQueryTime: number[];
    memoryUsage: number[];
    cpuUsage: number[];
    activeConnections: number;
}

class MetricsCollector {
    private metrics: PerformanceMetrics;
    private startTime: number;
    private intervals: NodeJS.Timer[];

    constructor() {
        this.metrics = {
            requestCount: new Map(),
            responseTime: new Map(),
            errorCount: new Map(),
            databaseQueryTime: [],
            memoryUsage: [],
            cpuUsage: [],
            activeConnections: 0
        };
        this.startTime = Date.now();
        this.intervals = [];
        this.startPeriodicCollection();
    }

    // 定期的なメトリクス収集を開始
    private startPeriodicCollection(): void {
        // メモリ使用量の監視（30秒間隔）
        const memoryInterval = setInterval(() => {
            const usage = process.memoryUsage();
            this.metrics.memoryUsage.push(usage.heapUsed);
            
            // 過去1時間分のデータのみ保持
            if (this.metrics.memoryUsage.length > 120) {
                this.metrics.memoryUsage.splice(0, this.metrics.memoryUsage.length - 120);
            }
        }, 30000);

        // CPU使用量の監視（30秒間隔）
        const cpuInterval = setInterval(() => {
            const usage = process.cpuUsage();
            const cpuPercent = (usage.user + usage.system) / 1000000; // マイクロ秒を秒に変換
            this.metrics.cpuUsage.push(cpuPercent);
            
            if (this.metrics.cpuUsage.length > 120) {
                this.metrics.cpuUsage.splice(0, this.metrics.cpuUsage.length - 120);
            }
        }, 30000);

        this.intervals.push(memoryInterval, cpuInterval);
    }

    // リクエストメトリクスを記録
    recordRequest(method: string, path: string, statusCode: number, responseTime: number): void {
        const key = `${method} ${path}`;
        
        // リクエスト数をカウント
        this.metrics.requestCount.set(key, (this.metrics.requestCount.get(key) || 0) + 1);
        
        // レスポンス時間を記録
        if (!this.metrics.responseTime.has(key)) {
            this.metrics.responseTime.set(key, []);
        }
        const times = this.metrics.responseTime.get(key)!;
        times.push(responseTime);
        
        // 過去100件のみ保持
        if (times.length > 100) {
            times.splice(0, times.length - 100);
        }
        
        // エラー数をカウント
        if (statusCode >= 400) {
            this.metrics.errorCount.set(key, (this.metrics.errorCount.get(key) || 0) + 1);
        }
    }

    // データベースクエリ時間を記録
    recordDatabaseQuery(duration: number): void {
        this.metrics.databaseQueryTime.push(duration);
        
        if (this.metrics.databaseQueryTime.length > 1000) {
            this.metrics.databaseQueryTime.splice(0, this.metrics.databaseQueryTime.length - 1000);
        }
    }

    // アクティブ接続数を更新
    updateActiveConnections(count: number): void {
        this.metrics.activeConnections = count;
    }

    // メトリクスの取得
    getMetrics(): any {
        const now = Date.now();
        const uptime = Math.floor((now - this.startTime) / 1000);
        
        // 統計計算のヘルパー関数
        const calculateStats = (values: number[]) => {
            if (values.length === 0) return { min: 0, max: 0, avg: 0, count: 0 };
            
            const sorted = [...values].sort((a, b) => a - b);
            return {
                min: sorted[0],
                max: sorted[sorted.length - 1],
                avg: values.reduce((a, b) => a + b, 0) / values.length,
                p50: sorted[Math.floor(sorted.length * 0.5)],
                p90: sorted[Math.floor(sorted.length * 0.9)],
                p95: sorted[Math.floor(sorted.length * 0.95)],
                p99: sorted[Math.floor(sorted.length * 0.99)],
                count: values.length
            };
        };

        // エンドポイント別統計
        const endpointStats = Array.from(this.metrics.requestCount.entries()).map(([endpoint, count]) => {
            const responseTimes = this.metrics.responseTime.get(endpoint) || [];
            const errorCount = this.metrics.errorCount.get(endpoint) || 0;
            
            return {
                endpoint,
                requestCount: count,
                errorCount,
                errorRate: count > 0 ? (errorCount / count) * 100 : 0,
                responseTime: calculateStats(responseTimes)
            };
        });

        return {
            system: {
                uptime,
                memory: calculateStats(this.metrics.memoryUsage),
                cpu: calculateStats(this.metrics.cpuUsage),
                activeConnections: this.metrics.activeConnections
            },
            database: {
                queryTime: calculateStats(this.metrics.databaseQueryTime)
            },
            endpoints: endpointStats,
            timestamp: now
        };
    }

    // Prometheus形式のメトリクス出力
    getPrometheusMetrics(): string {
        const metrics = this.getMetrics();
        let output = '';

        // ヘルプとタイプの定義
        output += '# HELP http_requests_total Total number of HTTP requests\n';
        output += '# TYPE http_requests_total counter\n';
        
        // エンドポイント別リクエスト数
        metrics.endpoints.forEach((endpoint: any) => {
            output += `http_requests_total{method="${endpoint.endpoint.split(' ')[0]}",path="${endpoint.endpoint.split(' ')[1]}"} ${endpoint.requestCount}\n`;
        });

        output += '\n# HELP http_request_duration_seconds HTTP request duration in seconds\n';
        output += '# TYPE http_request_duration_seconds histogram\n';
        
        // レスポンス時間のヒストグラム
        metrics.endpoints.forEach((endpoint: any) => {
            const method = endpoint.endpoint.split(' ')[0];
            const path = endpoint.endpoint.split(' ')[1];
            if (endpoint.responseTime.count > 0) {
                output += `http_request_duration_seconds{method="${method}",path="${path}",quantile="0.5"} ${endpoint.responseTime.p50 / 1000}\n`;
                output += `http_request_duration_seconds{method="${method}",path="${path}",quantile="0.9"} ${endpoint.responseTime.p90 / 1000}\n`;
                output += `http_request_duration_seconds{method="${method}",path="${path}",quantile="0.95"} ${endpoint.responseTime.p95 / 1000}\n`;
                output += `http_request_duration_seconds{method="${method}",path="${path}",quantile="0.99"} ${endpoint.responseTime.p99 / 1000}\n`;
            }
        });

        output += '\n# HELP nodejs_memory_heap_used_bytes Node.js heap memory used\n';
        output += '# TYPE nodejs_memory_heap_used_bytes gauge\n';
        output += `nodejs_memory_heap_used_bytes ${process.memoryUsage().heapUsed}\n`;

        output += '\n# HELP process_uptime_seconds Process uptime in seconds\n';
        output += '# TYPE process_uptime_seconds gauge\n';
        output += `process_uptime_seconds ${metrics.system.uptime}\n`;

        return output;
    }

    // メトリクスをリセット
    reset(): void {
        this.metrics.requestCount.clear();
        this.metrics.responseTime.clear();
        this.metrics.errorCount.clear();
        this.metrics.databaseQueryTime = [];
        this.metrics.memoryUsage = [];
        this.metrics.cpuUsage = [];
        this.metrics.activeConnections = 0;
        this.startTime = Date.now();
    }

    // リソースのクリーンアップ
    cleanup(): void {
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
    }
}

// シングルトンインスタンス
export const metricsCollector = new MetricsCollector();

// ================================
// パフォーマンス監視ミドルウェア
// ================================

export const performanceMonitoring = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // リクエスト開始時の処理
    req.on('close', () => {
        const duration = Date.now() - startTime;
        const path = req.route?.path || req.path;
        
        metricsCollector.recordRequest(req.method, path, res.statusCode, duration);
        
        // 遅いリクエストをログ出力
        if (duration > 1000) {
            logger.warn('Slow request detected', {
                method: req.method,
                path,
                duration,
                statusCode: res.statusCode,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
        }
    });

    next();
};

// ================================
// ヘルスチェック機能
// ================================

export const healthCheck = {
    // 基本的なヘルスチェック
    basic: async (): Promise<any> => {
        const uptime = process.uptime();
        const memory = process.memoryUsage();
        
        return {
            status: 'healthy',
            uptime: Math.floor(uptime),
            memory: {
                used: Math.round(memory.heapUsed / 1024 / 1024),
                total: Math.round(memory.heapTotal / 1024 / 1024),
                rss: Math.round(memory.rss / 1024 / 1024)
            },
            timestamp: new Date().toISOString()
        };
    },

    // 詳細なヘルスチェック
    detailed: async (): Promise<any> => {
        const basic = await healthCheck.basic();
        
        // データベース接続チェック
        let databaseStatus = 'unknown';
        let databaseLatency = 0;
        
        try {
            const db = getDatabase();
            const startTime = Date.now();
            await db.testConnection();
            databaseLatency = Date.now() - startTime;
            databaseStatus = 'connected';
        } catch (error) {
            databaseStatus = 'disconnected';
            logger.error('Database health check failed:', error);
        }

        // システムリソースチェック
        const loadAverage = process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0];
        const cpuCount = require('os').cpus().length;
        
        return {
            ...basic,
            status: databaseStatus === 'connected' ? 'healthy' : 'unhealthy',
            checks: {
                database: databaseStatus,
                memory: basic.memory.used < 400 ? 'ok' : 'warning', // 400MB以下
                uptime: basic.uptime > 60 ? 'ok' : 'starting',
                cpu: loadAverage[0] < cpuCount ? 'ok' : 'high_load'
            },
            database: {
                status: databaseStatus,
                latency: databaseLatency
            },
            system: {
                loadAverage,
                cpuCount,
                platform: process.platform,
                nodeVersion: process.version
            }
        };
    },

    // アプリケーション固有のヘルスチェック
    application: async (): Promise<any> => {
        const detailed = await healthCheck.detailed();
        const metrics = metricsCollector.getMetrics();
        
        // エラー率のチェック
        const totalRequests = metrics.endpoints.reduce((sum: number, ep: any) => sum + ep.requestCount, 0);
        const totalErrors = metrics.endpoints.reduce((sum: number, ep: any) => sum + ep.errorCount, 0);
        const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
        
        // 平均レスポンス時間のチェック
        const avgResponseTime = metrics.endpoints.reduce((sum: number, ep: any) => 
            sum + (ep.responseTime.avg || 0), 0) / (metrics.endpoints.length || 1);

        return {
            ...detailed,
            application: {
                totalRequests,
                totalErrors,
                errorRate: Math.round(errorRate * 100) / 100,
                avgResponseTime: Math.round(avgResponseTime * 100) / 100,
                status: errorRate < 5 && avgResponseTime < 500 ? 'healthy' : 'degraded'
            },
            performance: metrics
        };
    }
};

// ================================
// アラート機能
// ================================

interface AlertRule {
    name: string;
    condition: (metrics: any) => boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    cooldown: number; // アラートの最小間隔（ミリ秒）
}

class AlertManager {
    private rules: AlertRule[];
    private lastAlertTime: Map<string, number>;

    constructor() {
        this.rules = [
            {
                name: 'high_error_rate',
                condition: (metrics) => {
                    const totalRequests = metrics.endpoints.reduce((sum: number, ep: any) => sum + ep.requestCount, 0);
                    const totalErrors = metrics.endpoints.reduce((sum: number, ep: any) => sum + ep.errorCount, 0);
                    return totalRequests > 10 && (totalErrors / totalRequests) > 0.1; // 10%以上のエラー率
                },
                severity: 'high',
                message: 'High error rate detected',
                cooldown: 300000 // 5分
            },
            {
                name: 'high_response_time',
                condition: (metrics) => {
                    return metrics.endpoints.some((ep: any) => ep.responseTime.avg > 2000); // 2秒以上
                },
                severity: 'medium',
                message: 'High response time detected',
                cooldown: 300000
            },
            {
                name: 'high_memory_usage',
                condition: (metrics) => {
                    return metrics.system.memory.avg > 500 * 1024 * 1024; // 500MB以上
                },
                severity: 'medium',
                message: 'High memory usage detected',
                cooldown: 600000 // 10分
            },
            {
                name: 'database_slow_queries',
                condition: (metrics) => {
                    return metrics.database.queryTime.avg > 1000; // 1秒以上
                },
                severity: 'medium',
                message: 'Slow database queries detected',
                cooldown: 300000
            }
        ];
        this.lastAlertTime = new Map();
    }

    checkAlerts(): void {
        const metrics = metricsCollector.getMetrics();
        const now = Date.now();

        this.rules.forEach(rule => {
            const lastAlert = this.lastAlertTime.get(rule.name) || 0;
            
            if (rule.condition(metrics) && (now - lastAlert) > rule.cooldown) {
                this.triggerAlert(rule, metrics);
                this.lastAlertTime.set(rule.name, now);
            }
        });
    }

    private triggerAlert(rule: AlertRule, metrics: any): void {
        const alert = {
            name: rule.name,
            severity: rule.severity,
            message: rule.message,
            timestamp: new Date().toISOString(),
            metrics: {
                system: metrics.system,
                database: metrics.database
            }
        };

        logger.error('Alert triggered', alert);

        // 外部アラートシステムとの連携（将来実装）
        // this.sendToExternalSystem(alert);
    }
}

export const alertManager = new AlertManager();

// 定期的なアラートチェック（1分間隔）
setInterval(() => {
    alertManager.checkAlerts();
}, 60000);

// ================================
// プロセス終了時のクリーンアップ
// ================================

process.on('SIGINT', () => {
    metricsCollector.cleanup();
});

process.on('SIGTERM', () => {
    metricsCollector.cleanup();
});

// ================================
// エクスポート
// ================================

export default {
    metricsCollector,
    performanceMonitoring,
    healthCheck,
    alertManager
};
