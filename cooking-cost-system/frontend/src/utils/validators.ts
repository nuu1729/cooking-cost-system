import { VALIDATION, REGEX_PATTERNS } from './constants';

// バリデーション結果の型
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// 個別フィールドのバリデーション結果
export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

// 基本的なバリデーション関数
export const validators = {
  /**
   * 必須チェック
   */
  required: (value: any, fieldName: string = 'フィールド'): FieldValidationResult => {
    const isEmpty = value === null || value === undefined || 
                   (typeof value === 'string' && value.trim() === '') ||
                   (Array.isArray(value) && value.length === 0);
    
    return {
      isValid: !isEmpty,
      error: isEmpty ? `${fieldName}は必須です` : undefined,
    };
  },

  /**
   * 文字列長チェック
   */
  stringLength: (
    value: string, 
    min?: number, 
    max?: number, 
    fieldName: string = 'フィールド'
  ): FieldValidationResult => {
    if (typeof value !== 'string') {
      return { isValid: false, error: `${fieldName}は文字列である必要があります` };
    }

    const length = value.length;

    if (min !== undefined && length < min) {
      return { 
        isValid: false, 
        error: `${fieldName}は${min}文字以上で入力してください` 
      };
    }

    if (max !== undefined && length > max) {
      return { 
        isValid: false, 
        error: `${fieldName}は${max}文字以下で入力してください` 
      };
    }

    return { isValid: true };
  },

  /**
   * 数値範囲チェック
   */
  numberRange: (
    value: number, 
    min?: number, 
    max?: number, 
    fieldName: string = 'フィールド'
  ): FieldValidationResult => {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      return { isValid: false, error: `${fieldName}は有効な数値である必要があります` };
    }

    if (min !== undefined && value < min) {
      return { 
        isValid: false, 
        error: `${fieldName}は${min}以上である必要があります` 
      };
    }

    if (max !== undefined && value > max) {
      return { 
        isValid: false, 
        error: `${fieldName}は${max}以下である必要があります` 
      };
    }

    return { isValid: true };
  },

  /**
   * 正の数チェック
   */
  positiveNumber: (value: number, fieldName: string = 'フィールド'): FieldValidationResult => {
    return validators.numberRange(value, 0.01, undefined, fieldName);
  },

  /**
   * 整数チェック
   */
  integer: (value: number, fieldName: string = 'フィールド'): FieldValidationResult => {
    if (!Number.isInteger(value)) {
      return { isValid: false, error: `${fieldName}は整数である必要があります` };
    }
    return { isValid: true };
  },

  /**
   * メールアドレスチェック
   */
  email: (value: string, fieldName: string = 'メールアドレス'): FieldValidationResult => {
    if (!REGEX_PATTERNS.EMAIL.test(value)) {
      return { isValid: false, error: `${fieldName}の形式が正しくありません` };
    }
    return { isValid: true };
  },

  /**
   * 電話番号チェック
   */
  phone: (value: string, fieldName: string = '電話番号'): FieldValidationResult => {
    if (!REGEX_PATTERNS.PHONE.test(value)) {
      return { isValid: false, error: `${fieldName}の形式が正しくありません` };
    }
    return { isValid: true };
  },

  /**
   * 数値文字列チェック
   */
  numeric: (value: string, fieldName: string = 'フィールド'): FieldValidationResult => {
    if (!REGEX_PATTERNS.NUMERIC.test(value)) {
      return { isValid: false, error: `${fieldName}は数値で入力してください` };
    }
    return { isValid: true };
  },

  /**
   * 英数字チェック
   */
  alphanumeric: (value: string, fieldName: string = 'フィールド'): FieldValidationResult => {
    if (!REGEX_PATTERNS.ALPHANUMERIC.test(value)) {
      return { isValid: false, error: `${fieldName}は英数字で入力してください` };
    }
    return { isValid: true };
  },

  /**
   * URLチェック
   */
  url: (value: string, fieldName: string = 'URL'): FieldValidationResult => {
    try {
      new URL(value);
      return { isValid: true };
    } catch {
      return { isValid: false, error: `${fieldName}の形式が正しくありません` };
    }
  },

  /**
   * 日付チェック
   */
  date: (value: Date | string, fieldName: string = '日付'): FieldValidationResult => {
    const date = typeof value === 'string' ? new Date(value) : value;
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return { isValid: false, error: `${fieldName}が無効です` };
    }
    return { isValid: true };
  },

  /**
   * 未来日チェック
   */
  futureDate: (value: Date | string, fieldName: string = '日付'): FieldValidationResult => {
    const dateResult = validators.date(value, fieldName);
    if (!dateResult.isValid) return dateResult;

    const date = typeof value === 'string' ? new Date(value) : value;
    const now = new Date();
    
    if (date <= now) {
      return { isValid: false, error: `${fieldName}は未来の日付である必要があります` };
    }
    
    return { isValid: true };
  },

  /**
   * 過去日チェック
   */
  pastDate: (value: Date | string, fieldName: string = '日付'): FieldValidationResult => {
    const dateResult = validators.date(value, fieldName);
    if (!dateResult.isValid) return dateResult;

    const date = typeof value === 'string' ? new Date(value) : value;
    const now = new Date();
    
    if (date >= now) {
      return { isValid: false, error: `${fieldName}は過去の日付である必要があります` };
    }
    
    return { isValid: true };
  },

  /**
   * ファイルサイズチェック
   */
  fileSize: (file: File, maxSize: number, fieldName: string = 'ファイル'): FieldValidationResult => {
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / 1024 / 1024);
      return { 
        isValid: false, 
        error: `${fieldName}は${maxSizeMB}MB以下である必要があります` 
      };
    }
    return { isValid: true };
  },

  /**
   * ファイル形式チェック
   */
  fileType: (file: File, allowedTypes: string[], fieldName: string = 'ファイル'): FieldValidationResult => {
    if (!allowedTypes.includes(file.type)) {
      return { 
        isValid: false, 
        error: `${fieldName}の形式がサポートされていません` 
      };
    }
    return { isValid: true };
  },
};

// 食材バリデーション
export const validateIngredient = (ingredient: {
  name: string;
  store: string;
  quantity: number;
  unit: string;
  price: number;
  genre: string;
}): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 名前
  const nameResult = validators.required(ingredient.name, '食材名');
  if (!nameResult.isValid) errors.push(nameResult.error!);
  else {
    const lengthResult = validators.stringLength(
      ingredient.name, 
      1, 
      VALIDATION.INGREDIENT.NAME_MAX_LENGTH, 
      '食材名'
    );
    if (!lengthResult.isValid) errors.push(lengthResult.error!);
  }

  // 店舗
  const storeResult = validators.required(ingredient.store, '購入場所');
  if (!storeResult.isValid) errors.push(storeResult.error!);
  else {
    const lengthResult = validators.stringLength(
      ingredient.store, 
      1, 
      VALIDATION.INGREDIENT.STORE_MAX_LENGTH, 
      '購入場所'
    );
    if (!lengthResult.isValid) errors.push(lengthResult.error!);
  }

  // 数量
  const quantityResult = validators.numberRange(
    ingredient.quantity,
    VALIDATION.INGREDIENT.QUANTITY_MIN,
    VALIDATION.INGREDIENT.QUANTITY_MAX,
    '購入量'
  );
  if (!quantityResult.isValid) errors.push(quantityResult.error!);

  // 単位
  const unitResult = validators.required(ingredient.unit, '単位');
  if (!unitResult.isValid) errors.push(unitResult.error!);
  else {
    const lengthResult = validators.stringLength(
      ingredient.unit, 
      1, 
      VALIDATION.INGREDIENT.UNIT_MAX_LENGTH, 
      '単位'
    );
    if (!lengthResult.isValid) errors.push(lengthResult.error!);
  }

  // 価格
  const priceResult = validators.numberRange(
    ingredient.price,
    VALIDATION.INGREDIENT.PRICE_MIN,
    VALIDATION.INGREDIENT.PRICE_MAX,
    '価格'
  );
  if (!priceResult.isValid) errors.push(priceResult.error!);

  // ジャンル
  const genreResult = validators.required(ingredient.genre, 'ジャンル');
  if (!genreResult.isValid) errors.push(genreResult.error!);

  // 警告チェック
  if (ingredient.price > 10000) {
    warnings.push('価格が高額です。入力内容を確認してください。');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

// 料理バリデーション
export const validateDish = (dish: {
  name: string;
  description?: string;
  ingredients: { ingredient_id: number; used_quantity: number }[];
}): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 名前
  const nameResult = validators.required(dish.name, '料理名');
  if (!nameResult.isValid) errors.push(nameResult.error!);
  else {
    const lengthResult = validators.stringLength(
      dish.name, 
      1, 
      VALIDATION.DISH.NAME_MAX_LENGTH, 
      '料理名'
    );
    if (!lengthResult.isValid) errors.push(lengthResult.error!);
  }

  // 説明
  if (dish.description) {
    const descResult = validators.stringLength(
      dish.description, 
      0, 
      VALIDATION.DISH.DESCRIPTION_MAX_LENGTH, 
      '説明'
    );
    if (!descResult.isValid) errors.push(descResult.error!);
  }

  // 食材
  if (dish.ingredients.length < VALIDATION.DISH.MIN_INGREDIENTS) {
    errors.push(`食材は${VALIDATION.DISH.MIN_INGREDIENTS}種類以上選択してください`);
  }

  if (dish.ingredients.length > VALIDATION.DISH.MAX_INGREDIENTS) {
    errors.push(`食材は${VALIDATION.DISH.MAX_INGREDIENTS}種類以下にしてください`);
  }

  // 各食材の使用量チェック
  dish.ingredients.forEach((ing, index) => {
    const quantityResult = validators.positiveNumber(ing.used_quantity, `食材${index + 1}の使用量`);
    if (!quantityResult.isValid) errors.push(quantityResult.error!);
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

// 完成品バリデーション
export const validateCompletedFood = (food: {
  name: string;
  price?: number;
  description?: string;
  dishes: { dish_id: number; usage_quantity: number; usage_unit: string }[];
}): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 名前
  const nameResult = validators.required(food.name, '完成品名');
  if (!nameResult.isValid) errors.push(nameResult.error!);
  else {
    const lengthResult = validators.stringLength(
      food.name, 
      1, 
      VALIDATION.COMPLETED_FOOD.NAME_MAX_LENGTH, 
      '完成品名'
    );
    if (!lengthResult.isValid) errors.push(lengthResult.error!);
  }

  // 価格
  if (food.price !== undefined) {
    const priceResult = validators.numberRange(
      food.price,
      VALIDATION.COMPLETED_FOOD.PRICE_MIN,
      VALIDATION.COMPLETED_FOOD.PRICE_MAX,
      '価格'
    );
    if (!priceResult.isValid) errors.push(priceResult.error!);
  }

  // 説明
  if (food.description) {
    const descResult = validators.stringLength(
      food.description, 
      0, 
      VALIDATION.COMPLETED_FOOD.DESCRIPTION_MAX_LENGTH, 
      '説明'
    );
    if (!descResult.isValid) errors.push(descResult.error!);
  }

  // 料理
  if (food.dishes.length < VALIDATION.COMPLETED_FOOD.MIN_DISHES) {
    errors.push(`料理は${VALIDATION.COMPLETED_FOOD.MIN_DISHES}種類以上選択してください`);
  }

  if (food.dishes.length > VALIDATION.COMPLETED_FOOD.MAX_DISHES) {
    errors.push(`料理は${VALIDATION.COMPLETED_FOOD.MAX_DISHES}種類以下にしてください`);
  }

  // 各料理の使用量チェック
  food.dishes.forEach((dish, index) => {
    const quantityResult = validators.positiveNumber(dish.usage_quantity, `料理${index + 1}の使用量`);
    if (!quantityResult.isValid) errors.push(quantityResult.error!);

    if (!['ratio', 'serving'].includes(dish.usage_unit)) {
      errors.push(`料理${index + 1}の使用単位が無効です`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

// メモバリデーション
export const validateMemo = (memo: { content: string }): ValidationResult => {
  const errors: string[] = [];

  // 内容
  const contentResult = validators.required(memo.content, 'メモ内容');
  if (!contentResult.isValid) errors.push(contentResult.error!);
  else {
    const lengthResult = validators.stringLength(
      memo.content, 
      1, 
      VALIDATION.MEMO.CONTENT_MAX_LENGTH, 
      'メモ内容'
    );
    if (!lengthResult.isValid) errors.push(lengthResult.error!);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// 汎用オブジェクトバリデーション
export const validateObject = (
  obj: Record<string, any>, 
  rules: Record<string, (value: any) => FieldValidationResult>
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  Object.entries(rules).forEach(([field, validator]) => {
    const result = validator(obj[field]);
    if (!result.isValid && result.error) {
      errors.push(result.error);
    }
    if (result.warning) {
      warnings.push(result.warning);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

// フォームバリデーション用ヘルパー
export const createValidator = (rules: Record<string, any[]>) => {
  return (values: Record<string, any>) => {
    const errors: Record<string, string> = {};

    Object.entries(rules).forEach(([field, fieldRules]) => {
      const value = values[field];
      
      for (const rule of fieldRules) {
        const result = rule(value);
        if (!result.isValid && result.error) {
          errors[field] = result.error;
          break; // 最初のエラーで停止
        }
      }
    });

    return errors;
  };
};

// バリデーション結果をマージ
export const mergeValidationResults = (...results: ValidationResult[]): ValidationResult => {
  const allErrors = results.flatMap(r => r.errors);
  const allWarnings = results.flatMap(r => r.warnings || []);

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings.length > 0 ? allWarnings : undefined,
  };
};

// デバウンスバリデーション
export const createDebouncedValidator = (
  validator: (value: any) => FieldValidationResult,
  delay: number = 300
) => {
  let timeoutId: NodeJS.Timeout;

  return (value: any): Promise<FieldValidationResult> => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        resolve(validator(value));
      }, delay);
    });
  };
};

export default validators;
