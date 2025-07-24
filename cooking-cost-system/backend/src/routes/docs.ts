import { Router, Request, Response } from 'express';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// ================================
// Swagger設定
// ================================

const swaggerOptions: swaggerJSDoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: '🍽️ 料理原価計算システム API',
            version: '2.0.0',
            description: `
モダンな料理原価計算システムのRESTful APIです。
食材管理、料理作成、完成品の原価計算、レポート生成などの機能を提供します。

## 主な機能
- 📦 食材管理（購入情報、単価計算）
- 🍳 料理管理（レシピ、原価計算）
- 🍽️ 完成品管理（料理組み合わせ、利益率計算）
- 📊 レポート機能（統計、分析）
- 📝 メモ機能
- 📁 ファイルアップロード
- 🔐 認証・認可（将来実装）

## 認証について
現在のバージョンでは簡易認証を実装しています。
将来的にはJWTベースの認証に移行予定です。

## レート制限
- 一般API: 15分間に100リクエスト
- アップロード: 1時間に10ファイル
- 認証: 15分間に5回の試行

## エラーレスポンス
全てのエラーレスポンスは以下の形式で返されます：
\`\`\`json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "エラーメッセージ",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
\`\`\`
            `,
            contact: {
                name: 'API サポート',
                email: 'support@cooking-system.local',
                url: 'https://github.com/cooking-cost-system/backend'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:3001',
                description: '開発サーバー'
            },
            {
                url: 'https://api-staging.cooking-system.com',
                description: 'ステージングサーバー'
            },
            {
                url: 'https://api.cooking-system.com',
                description: '本番サーバー'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT認証トークン'
                },
                apiKey: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-API-Key',
                    description: 'API キー（将来実装）'
                }
            },
            schemas: {
                // 共通スキーマ
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        data: {
                            type: 'object',
                            description: 'レスポンスデータ'
                        },
                        message: {
                            type: 'string',
                            example: '操作が成功しました'
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time',
                            example: '2025-01-01T12:00:00.000Z'
                        },
                        count: {
                            type: 'integer',
                            description: 'データ件数（リスト取得時）'
                        }
                    },
                    required: ['success', 'timestamp']
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        error: {
                            type: 'string',
                            example: 'VALIDATION_ERROR'
                        },
                        message: {
                            type: 'string',
                            example: 'バリデーションエラーが発生しました'
                        },
                        details: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: { type: 'string' },
                                    message: { type: 'string' },
                                    value: {}
                                }
                            }
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time'
                        },
                        path: {
                            type: 'string',
                            example: '/api/ingredients'
                        },
                        method: {
                            type: 'string',
                            example: 'POST'
                        }
                    },
                    required: ['success', 'error', 'message', 'timestamp']
                },
                // 食材スキーマ
                Ingredient: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            example: 1,
                            description: '食材ID'
                        },
                        name: {
                            type: 'string',
                            example: '豚バラ肉',
                            description: '食材名'
                        },
                        store: {
                            type: 'string',
                            example: 'スーパーマルエツ',
                            description: '購入店舗'
                        },
                        quantity: {
                            type: 'number',
                            format: 'decimal',
                            example: 500.00,
                            description: '購入数量'
                        },
                        unit: {
                            type: 'string',
                            example: 'g',
                            description: '単位'
                        },
                        price: {
                            type: 'number',
                            format: 'decimal',
                            example: 450.00,
                            description: '購入価格'
                        },
                        unit_price: {
                            type: 'number',
                            format: 'decimal',
                            example: 0.9000,
                            description: '単価（price / quantity）'
                        },
                        genre: {
                            type: 'string',
                            enum: ['meat', 'vegetable', 'seasoning', 'sauce', 'frozen', 'drink'],
                            example: 'meat',
                            description: 'ジャンル'
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            description: '作成日時'
                        },
                        updated_at: {
                            type: 'string',
                            format: 'date-time',
                            description: '更新日時'
                        }
                    },
                    required: ['name', 'store', 'quantity', 'unit', 'price', 'genre']
                },
                CreateIngredientRequest: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            minLength: 1,
                            maxLength: 255,
                            example: '豚バラ肉',
                            description: '食材名'
                        },
                        store: {
                            type: 'string',
                            minLength: 1,
                            maxLength: 100,
                            example: 'スーパーマルエツ',
                            description: '購入店舗'
                        },
                        quantity: {
                            type: 'number',
                            minimum: 0.01,
                            maximum: 999999.99,
                            example: 500.00,
                            description: '購入数量'
                        },
                        unit: {
                            type: 'string',
                            minLength: 1,
                            maxLength: 20,
                            example: 'g',
                            description: '単位'
                        },
                        price: {
                            type: 'number',
                            minimum: 0.01,
                            maximum: 999999.99,
                            example: 450.00,
                            description: '購入価格'
                        },
                        genre: {
                            type: 'string',
                            enum: ['meat', 'vegetable', 'seasoning', 'sauce', 'frozen', 'drink'],
                            example: 'meat',
                            description: 'ジャンル'
                        }
                    },
                    required: ['name', 'store', 'quantity', 'unit', 'price', 'genre']
                },
                // 料理スキーマ
                Dish: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            example: 1,
                            description: '料理ID'
                        },
                        name: {
                            type: 'string',
                            example: '豚の生姜焼き',
                            description: '料理名'
                        },
                        total_cost: {
                            type: 'number',
                            format: 'decimal',
                            example: 238.00,
                            description: '総原価'
                        },
                        genre: {
                            type: 'string',
                            example: 'main',
                            description: 'ジャンル'
                        },
                        description: {
                            type: 'string',
                            example: 'ご飯が進む定番の豚の生姜焼き',
                            description: '説明'
                        },
                        ingredients: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/DishIngredient'
                            },
                            description: '使用食材一覧'
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updated_at: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                DishIngredient: {
                    type: 'object',
                    properties: {
                        ingredient_id: {
                            type: 'integer',
                            example: 1,
                            description: '食材ID'
                        },
                        used_quantity: {
                            type: 'number',
                            format: 'decimal',
                            example: 200.00,
                            description: '使用量'
                        },
                        used_cost: {
                            type: 'number',
                            format: 'decimal',
                            example: 180.00,
                            description: '使用コスト'
                        },
                        ingredient_name: {
                            type: 'string',
                            example: '豚バラ肉',
                            description: '食材名'
                        },
                        ingredient_unit: {
                            type: 'string',
                            example: 'g',
                            description: '食材の単位'
                        }
                    }
                },
                // 完成品スキーマ
                CompletedFood: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            example: 1
                        },
                        name: {
                            type: 'string',
                            example: '定食A（生姜焼き定食）'
                        },
                        price: {
                            type: 'number',
                            format: 'decimal',
                            example: 850.00,
                            description: '販売価格'
                        },
                        total_cost: {
                            type: 'number',
                            format: 'decimal',
                            example: 283.35,
                            description: '総原価'
                        },
                        profit: {
                            type: 'number',
                            format: 'decimal',
                            example: 566.65,
                            description: '利益（price - total_cost）'
                        },
                        profit_rate: {
                            type: 'number',
                            format: 'decimal',
                            example: 66.67,
                            description: '利益率（%）'
                        },
                        description: {
                            type: 'string',
                            example: '豚の生姜焼き、味噌汁、サラダのセット'
                        },
                        dishes: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/FoodDish'
                            }
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updated_at: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                FoodDish: {
                    type: 'object',
                    properties: {
                        dish_id: {
                            type: 'integer',
                            example: 1
                        },
                        usage_quantity: {
                            type: 'number',
                            format: 'decimal',
                            example: 1.0000
                        },
                        usage_unit: {
                            type: 'string',
                            enum: ['ratio', 'serving'],
                            example: 'serving',
                            description: 'ratio: 割合指定, serving: 人前指定'
                        },
                        usage_cost: {
                            type: 'number',
                            format: 'decimal',
                            example: 238.00
                        },
                        description: {
                            type: 'string',
                            example: '豚の生姜焼き 1人前'
                        },
                        dish_name: {
                            type: 'string',
                            example: '豚の生姜焼き'
                        }
                    }
                }
            },
            parameters: {
                LimitParam: {
                    name: 'limit',
                    in: 'query',
                    description: '取得件数上限',
                    schema: {
                        type: 'integer',
                        minimum: 1,
                        maximum: 100,
                        default: 50
                    }
                },
                OffsetParam: {
                    name: 'offset',
                    in: 'query',
                    description: '取得開始位置',
                    schema: {
                        type: 'integer',
                        minimum: 0,
                        default: 0
                    }
                },
                SortByParam: {
                    name: 'sortBy',
                    in: 'query',
                    description: 'ソート項目',
                    schema: {
                        type: 'string',
                        default: 'created_at'
                    }
                },
                SortOrderParam: {
                    name: 'sortOrder',
                    in: 'query',
                    description: 'ソート順序',
                    schema: {
                        type: 'string',
                        enum: ['ASC', 'DESC'],
                        default: 'DESC'
                    }
                }
            },
            responses: {
                SuccessResponse: {
                    description: '成功レスポンス',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/SuccessResponse'
                            }
                        }
                    }
                },
                ErrorResponse: {
                    description: 'エラーレスポンス',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                },
                NotFound: {
                    description: 'リソースが見つかりません',
                    content: {
                        'application/json': {
                            schema: {
                                allOf: [
                                    { $ref: '#/components/schemas/ErrorResponse' },
                                    {
                                        type: 'object',
                                        properties: {
                                            error: { example: 'NOT_FOUND' },
                                            message: { example: 'Resource not found' }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                ValidationError: {
                    description: 'バリデーションエラー',
                    content: {
                        'application/json': {
                            schema: {
                                allOf: [
                                    { $ref: '#/components/schemas/ErrorResponse' },
                                    {
                                        type: 'object',
                                        properties: {
                                            error: { example: 'VALIDATION_ERROR' },
                                            message: { example: 'Validation failed' }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                RateLimitExceeded: {
                    description: 'レート制限に達しました',
                    content: {
                        'application/json': {
                            schema: {
                                allOf: [
                                    { $ref: '#/components/schemas/ErrorResponse' },
                                    {
                                        type: 'object',
                                        properties: {
                                            error: { example: 'RATE_LIMIT_EXCEEDED' },
                                            message: { example: 'Too many requests' }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ],
        tags: [
            {
                name: 'Health',
                description: 'システムヘルスチェック'
            },
            {
                name: 'Ingredients',
                description: '食材管理'
            },
            {
                name: 'Dishes',
                description: '料理管理'
            },
            {
                name: 'Completed Foods',
                description: '完成品管理'
            },
            {
                name: 'Reports',
                description: 'レポート・統計'
            },
            {
                name: 'Memo',
                description: 'メモ機能'
            },
            {
                name: 'Upload',
                description: 'ファイルアップロード'
            },
            {
                name: 'Auth',
                description: '認証・認可'
            }
        ]
    },
    apis: [
        './src/routes/*.ts',
        './src/models/*.ts',
        './docs/swagger/*.yaml'
    ]
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

// ================================
// Swagger UI設定
// ================================

const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
    customCss: `
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info .title { color: #2c3e50; }
        .swagger-ui .info .description p { color: #34495e; }
        .swagger-ui .scheme-container { background: #f8f9fa; }
        .swagger-ui .opblock.opblock-post { border-color: #27ae60; }
        .swagger-ui .opblock.opblock-get { border-color: #3498db; }
        .swagger-ui .opblock.opblock-put { border-color: #f39c12; }
        .swagger-ui .opblock.opblock-delete { border-color: #e74c3c; }
    `,
    customSiteTitle: '料理原価計算システム API ドキュメント',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
        requestInterceptor: (req: any) => {
            // APIキーやトークンの自動追加など
            return req;
        }
    }
};

// ================================
// ルート設定
// ================================

// Swagger UI の提供
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// OpenAPI JSON仕様の提供
router.get('/openapi.json', asyncHandler(async (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
}));

// ドキュメント情報の提供
router.get('/info', asyncHandler(async (req: Request, res: Response) => {
    res.json({
        title: swaggerSpec.info.title,
        version: swaggerSpec.info.version,
        description: swaggerSpec.info.description,
        contact: swaggerSpec.info.contact,
        license: swaggerSpec.info.license,
        servers: swaggerSpec.servers,
        tags: swaggerSpec.tags,
        paths: Object.keys(swaggerSpec.paths || {}),
        components: {
            schemas: Object.keys(swaggerSpec.components?.schemas || {}),
            securitySchemes: Object.keys(swaggerSpec.components?.securitySchemes || {})
        },
        generatedAt: new Date().toISOString()
    });
}));

export default router;
