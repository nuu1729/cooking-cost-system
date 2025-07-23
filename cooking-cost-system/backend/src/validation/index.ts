import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../middleware/errorHandler';

// ジャンル定義
const VALID_GENRES = ['meat', 'vegetable', 'seasoning', 'sauce', 'frozen', 'drink'];
const VALID_USAGE_UNITS = ['ratio', 'serving'];

// 食材バリデーションスキーマ
export const ingredientValidation = {
    create: Joi.object({
        name: Joi.string()
            .trim()
            .min(1)
            .max(255)
            .required()
            .messages({
                'string.empty': '食材名は必須です',
                'string.max': '食材名は255文字以内で入力してください',
                'any.required': '食材名は必須です'
            }),
        
        store: Joi.string()
            .trim()
            .min(1)
            .max(100)
            .required()
            .messages({
                'string.empty': '購入場所は必須です',
                'string.max': '購入場所は100文字以内で入力してください',
                'any.required': '購入場所は必須です'
            }),
        
        quantity: Joi.number()
            .positive()
            .precision(2)
            .max(999999.99)
            .required()
            .messages({
                'number.positive': '購入量は0より大きい値を入力してください',
                'number.precision': '購入量は小数点2桁以内で入力してください',
                'number.max': '購入量は999,999.99以下で入力してください',
                'any.required': '購入量は必須です'
            }),
        
        unit: Joi.string()
            .trim()
            .min(1)
            .max(20)
            .required()
            .messages({
                'string.empty': '単位は必須です',
                'string.max': '単位は20文字以内で入力してください',
                'any.required': '単位は必須です'
            }),
        
        price: Joi.number()
            .positive()
            .precision(2)
            .max(999999.99)
            .required()
            .messages({
                'number.positive': '価格は0より大きい値を入力してください',
                'number.precision': '価格は小数点2桁以内で入力してください',
                'number.max': '価格は999,999.99以下で入力してください',
                'any.required': '価格は必須です'
            }),
        
        genre: Joi.string()
            .valid(...VALID_GENRES)
            .required()
            .messages({
                'any.only': `ジャンルは次の値から選択してください: ${VALID_GENRES.join(', ')}`,
                'any.required': 'ジャンルは必須です'
            })
    }),
    
    update: Joi.object({
        name: Joi.string()
            .trim()
            .min(1)
            .max(255)
            .messages({
                'string.empty': '食材名を入力してください',
                'string.max': '食材名は255文字以内で入力してください'
            }),
        
        store: Joi.string()
            .trim()
            .min(1)
            .max(100)
            .messages({
                'string.empty': '購入場所を入力してください',
                'string.max': '購入場所は100文字以内で入力してください'
            }),
        
        quantity: Joi.number()
            .positive()
            .precision(2)
            .max(999999.99)
            .messages({
                'number.positive': '購入量は0より大きい値を入力してください',
                'number.precision': '購入量は小数点2桁以内で入力してください',
                'number.max': '購入量は999,999.99以下で入力してください'
            }),
        
        unit: Joi.string()
            .trim()
            .min(1)
            .max(20)
            .messages({
                'string.empty': '単位を入力してください',
                'string.max': '単位は20文字以内で入力してください'
            }),
        
        price: Joi.number()
            .positive()
            .precision(2)
            .max(999999.99)
            .messages({
                'number.positive': '価格は0より大きい値を入力してください',
                'number.precision': '価格は小数点2桁以内で入力してください',
                'number.max': '価格は999,999.99以下で入力してください'
            }),
        
        genre: Joi.string()
            .valid(...VALID_GENRES)
            .messages({
                'any.only': `ジャンルは次の値から選択してください: ${VALID_GENRES.join(', ')}`
            })
    }).min(1).messages({
        'object.min': '更新する項目を少なくとも1つ指定してください'
    })
};

// 料理バリデーションスキーマ
export const dishValidation = {
    create: Joi.object({
        name: Joi.string()
            .trim()
            .min(1)
            .max(255)
            .required()
            .messages({
                'string.empty': '料理名は必須です',
                'string.max': '料理名は255文字以内で入力してください',
                'any.required': '料理名は必須です'
            }),
        
        genre: Joi.string()
            .trim()
            .max(50)
            .default('main')
            .messages({
                'string.max': 'ジャンルは50文字以内で入力してください'
            }),
        
        description: Joi.string()
            .trim()
            .max(1000)
            .allow('')
            .messages({
                'string.max': '説明は1000文字以内で入力してください'
            }),
        
        ingredients: Joi.array()
            .items(
                Joi.object({
                    ingredient_id: Joi.number()
                        .integer()
                        .positive()
                        .required()
                        .messages({
                            'number.positive': '食材IDは正の整数である必要があります',
                            'any.required': '食材IDは必須です'
                        }),
                    
                    used_quantity: Joi.number()
                        .positive()
                        .precision(2)
                        .max(999999.99)
                        .required()
                        .messages({
                            'number.positive': '使用量は0より大きい値を入力してください',
                            'number.precision': '使用量は小数点2桁以内で入力してください',
                            'number.max': '使用量は999,999.99以下で入力してください',
                            'any.required': '使用量は必須です'
                        })
                })
            )
            .min(1)
            .required()
            .messages({
                'array.min': '食材を少なくとも1つ選択してください',
                'any.required': '食材は必須です'
            })
    }),
    
    update: Joi.object({
        name: Joi.string()
            .trim()
            .min(1)
            .max(255)
            .messages({
                'string.empty': '料理名を入力してください',
                'string.max': '料理名は255文字以内で入力してください'
            }),
        
        genre: Joi.string()
            .trim()
            .max(50)
            .messages({
                'string.max': 'ジャンルは50文字以内で入力してください'
            }),
        
        description: Joi.string()
            .trim()
            .max(1000)
            .allow('')
            .messages({
                'string.max': '説明は1000文字以内で入力してください'
            }),
        
        ingredients: Joi.array()
            .items(
                Joi.object({
                    ingredient_id: Joi.number()
                        .integer()
                        .positive()
                        .required(),
                    
                    used_quantity: Joi.number()
                        .positive()
                        .precision(2)
                        .max(999999.99)
                        .required()
                })
            )
            .min(1)
    }).min(1).messages({
        'object.min': '更新する項目を少なくとも1つ指定してください'
    })
};

// 完成品バリデーションスキーマ
export const completedFoodValidation = {
    create: Joi.object({
        name: Joi.string()
            .trim()
            .min(1)
            .max(255)
            .required()
            .messages({
                'string.empty': '完成品名は必須です',
                'string.max': '完成品名は255文字以内で入力してください',
                'any.required': '完成品名は必須です'
            }),
        
        price: Joi.number()
            .positive()
            .precision(2)
            .max(999999.99)
            .allow(null)
            .messages({
                'number.positive': '販売価格は0より大きい値を入力してください',
                'number.precision': '販売価格は小数点2桁以内で入力してください',
                'number.max': '販売価格は999,999.99以下で入力してください'
            }),
        
        description: Joi.string()
            .trim()
            .max(1000)
            .allow('')
            .messages({
                'string.max': '説明は1000文字以内で入力してください'
            }),
        
        dishes: Joi.array()
            .items(
                Joi.object({
                    dish_id: Joi.number()
                        .integer()
                        .positive()
                        .required()
                        .messages({
                            'number.positive': '料理IDは正の整数である必要があります',
                            'any.required': '料理IDは必須です'
                        }),
                    
                    usage_quantity: Joi.number()
                        .positive()
                        .precision(4)
                        .max(9999.9999)
                        .required()
                        .messages({
                            'number.positive': '使用量は0より大きい値を入力してください',
                            'number.precision': '使用量は小数点4桁以内で入力してください',
                            'number.max': '使用量は9,999.9999以下で入力してください',
                            'any.required': '使用量は必須です'
                        }),
                    
                    usage_unit: Joi.string()
                        .valid(...VALID_USAGE_UNITS)
                        .required()
                        .messages({
                            'any.only': `使用単位は次の値から選択してください: ${VALID_USAGE_UNITS.join(', ')}`,
                            'any.required': '使用単位は必須です'
                        }),
                    
                    description: Joi.string()
                        .trim()
                        .max(255)
                        .allow('')
                        .messages({
                            'string.max': '説明は255文字以内で入力してください'
                        })
                })
            )
            .min(1)
            .required()
            .messages({
                'array.min': '料理を少なくとも1つ選択してください',
                'any.required': '料理は必須です'
            })
    }),
    
    update: Joi.object({
        name: Joi.string()
            .trim()
            .min(1)
            .max(255)
            .messages({
                'string.empty': '完成品名を入力してください',
                'string.max': '完成品名は255文字以内で入力してください'
            }),
        
        price: Joi.number()
            .positive()
            .precision(2)
            .max(999999.99)
            .allow(null)
            .messages({
                'number.positive': '販売価格は0より大きい値を入力してください',
                'number.precision': '販売価格は小数点2桁以内で入力してください',
                'number.max': '販売価格は999,999.99以下で入力してください'
            }),
        
        description: Joi.string()
            .trim()
            .max(1000)
            .allow('')
            .messages({
                'string.max': '説明は1000文字以内で入力してください'
            }),
        
        dishes: Joi.array()
            .items(
                Joi.object({
                    dish_id: Joi.number()
                        .integer()
                        .positive()
                        .required(),
                    
                    usage_quantity: Joi.number()
                        .positive()
                        .precision(4)
                        .max(9999.9999)
                        .required(),
                    
                    usage_unit: Joi.string()
                        .valid(...VALID_USAGE_UNITS)
                        .required(),
                    
                    description: Joi.string()
                        .trim()
                        .max(255)
                        .allow('')
                })
            )
            .min(1)
    }).min(1).messages({
        'object.min': '更新する項目を少なくとも1つ指定してください'
    })
};

// メモバリデーションスキーマ
export const memoValidation = {
    create: Joi.object({
        content: Joi.string()
            .trim()
            .min(1)
            .max(10000)
            .required()
            .messages({
                'string.empty': 'メモ内容は必須です',
                'string.max': 'メモ内容は10,000文字以内で入力してください',
                'any.required': 'メモ内容は必須です'
            })
    }),
    
    update: Joi.object({
        content: Joi.string()
            .trim()
            .min(1)
            .max(10000)
            .required()
            .messages({
                'string.empty': 'メモ内容は必須です',
                'string.max': 'メモ内容は10,000文字以内で入力してください',
                'any.required': 'メモ内容は必須です'
            })
    })
};

// 認証バリデーションスキーマ
export const authValidation = {
    login: Joi.object({
        username: Joi.string()
            .trim()
            .min(3)
            .max(50)
            .required()
            .messages({
                'string.empty': 'ユーザー名は必須です',
                'string.min': 'ユーザー名は3文字以上で入力してください',
                'string.max': 'ユーザー名は50文字以内で入力してください',
                'any.required': 'ユーザー名は必須です'
            }),
        
        password: Joi.string()
            .min(6)
            .max(100)
            .required()
            .messages({
                'string.empty': 'パスワードは必須です',
                'string.min': 'パスワードは6文字以上で入力してください',
                'string.max': 'パスワードは100文字以内で入力してください',
                'any.required': 'パスワードは必須です'
            })
    })
};

// 検索パラメータバリデーションスキーマ
export const searchValidation = {
    ingredients: Joi.object({
        name: Joi.string().trim().max(255),
        store: Joi.string().trim().max(100),
        genre: Joi.string().valid(...VALID_GENRES),
        minPrice: Joi.number().min(0).precision(2),
        maxPrice: Joi.number().min(0).precision(2),
        sortBy: Joi.string().valid('name', 'price', 'unit_price', 'created_at').default('created_at'),
        sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC'),
        limit: Joi.number().integer().min(1).max(100).default(50),
        offset: Joi.number().integer().min(0).default(0)
    }),
    
    dishes: Joi.object({
        name: Joi.string().trim().max(255),
        genre: Joi.string().trim().max(50),
        minCost: Joi.number().min(0).precision(2),
        maxCost: Joi.number().min(0).precision(2),
        sortBy: Joi.string().valid('name', 'total_cost', 'created_at').default('created_at'),
        sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC'),
        limit: Joi.number().integer().min(1).max(100).default(50),
        offset: Joi.number().integer().min(0).default(0)
    }),
    
    completedFoods: Joi.object({
        name: Joi.string().trim().max(255),
        minPrice: Joi.number().min(0).precision(2),
        maxPrice: Joi.number().min(0).precision(2),
        minCost: Joi.number().min(0).precision(2),
        maxCost: Joi.number().min(0).precision(2),
        sortBy: Joi.string().valid('name', 'price', 'total_cost', 'created_at').default('created_at'),
        sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC'),
        limit: Joi.number().integer().min(1).max(100).default(50),
        offset: Joi.number().integer().min(0).default(0)
    })
};

// IDパラメータバリデーション
export const idValidation = Joi.object({
    id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'number.positive': 'IDは正の整数である必要があります',
            'any.required': 'IDは必須です'
        })
});

// バリデーションミドルウェア生成関数
export const validateRequest = (schema: Joi.ObjectSchema, source: 'body' | 'query' | 'params' = 'body') => {
    return (req: Request, res: Response, next: NextFunction) => {
        const data = req[source];
        const { error, value } = schema.validate(data, {
            abortEarly: false,
            stripUnknown: true,
            convert: true
        });

        if (error) {
            const details = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context?.value
            }));

            throw new BadRequestError('バリデーションエラー', details);
        }

        // バリデーションされた値でリクエストを更新
        req[source] = value;
        next();
    };
};

// 複数のソースを同時にバリデーションする関数
export const validateMultiple = (schemas: {
    body?: Joi.ObjectSchema;
    query?: Joi.ObjectSchema;
    params?: Joi.ObjectSchema;
}) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const errors: any[] = [];

        // 各ソースをバリデーション
        Object.entries(schemas).forEach(([source, schema]) => {
            const data = req[source as keyof Request];
            const { error, value } = schema.validate(data, {
                abortEarly: false,
                stripUnknown: true,
                convert: true
            });

            if (error) {
                const details = error.details.map(detail => ({
                    field: `${source}.${detail.path.join('.')}`,
                    message: detail.message,
                    value: detail.context?.value
                }));
                errors.push(...details);
            } else {
                // バリデーションされた値でリクエストを更新
                (req as any)[source] = value;
            }
        });

        if (errors.length > 0) {
            throw new BadRequestError('バリデーションエラー', errors);
        }

        next();
    };
};

// カスタムバリデーション関数
export const customValidators = {
    // 未来の日付チェック
    isFutureDate: (value: Date) => {
        return value > new Date();
    },
    
    // 営業時間内チェック
    isBusinessHours: (value: Date) => {
        const hour = value.getHours();
        return hour >= 9 && hour <= 22;
    },
    
    // 重複チェック（データベースアクセスが必要な場合用）
    isUnique: async (tableName: string, field: string, value: any, excludeId?: number) => {
        // 実装は後でデータベース層と連携
        return true;
    }
};

export default {
    ingredientValidation,
    dishValidation,
    completedFoodValidation,
    memoValidation,
    authValidation,
    searchValidation,
    idValidation,
    validateRequest,
    validateMultiple,
    customValidators
};
