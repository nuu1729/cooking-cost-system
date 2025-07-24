import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CURRENCY, DATE_FORMATS, GENRE_INFO } from './constants';

// 数値関連のヘルパー関数
export const numberUtils = {
  /**
   * 数値を通貨形式でフォーマット
   */
  formatCurrency: (value: number, options?: { 
    showSymbol?: boolean; 
    decimalPlaces?: number;
  }): string => {
    const { showSymbol = true, decimalPlaces = CURRENCY.DECIMAL_PLACES } = options || {};
    
    const formatted = new Intl.NumberFormat('ja-JP', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(value);
    
    return showSymbol ? `${CURRENCY.SYMBOL}${formatted}` : formatted;
  },

  /**
   * 数値を3桁区切りでフォーマット
   */
  formatNumber: (value: number, decimalPlaces?: number): string => {
    return new Intl.NumberFormat('ja-JP', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(value);
  },

  /**
   * パーセンテージをフォーマット
   */
  formatPercentage: (value: number, decimalPlaces: number = 1): string => {
    return `${value.toFixed(decimalPlaces)}%`;
  },

  /**
   * 数値を丸める
   */
  round: (value: number, decimalPlaces: number = 2): number => {
    const factor = Math.pow(10, decimalPlaces);
    return Math.round(value * factor) / factor;
  },

  /**
   * 安全な除算（0除算を避ける）
   */
  safeDivide: (numerator: number, denominator: number, fallback: number = 0): number => {
    return denominator === 0 ? fallback : numerator / denominator;
  },

  /**
   * 範囲内の値にクランプ
   */
  clamp: (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
  },

  /**
   * 数値が有効な範囲内かチェック
   */
  isValidNumber: (value: any, min?: number, max?: number): boolean => {
    const num = Number(value);
    if (isNaN(num) || !isFinite(num)) return false;
    if (min !== undefined && num < min) return false;
    if (max !== undefined && num > max) return false;
    return true;
  },
};

// 文字列関連のヘルパー関数
export const stringUtils = {
  /**
   * 文字列を切り詰める
   */
  truncate: (str: string, length: number, suffix: string = '...'): string => {
    if (str.length <= length) return str;
    return str.substring(0, length - suffix.length) + suffix;
  },

  /**
   * 文字列をケバブケースに変換
   */
  toKebabCase: (str: string): string => {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/\s+/g, '-')
      .toLowerCase();
  },

  /**
   * 文字列をキャメルケースに変換
   */
  toCamelCase: (str: string): string => {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      })
      .replace(/\s+/g, '');
  },

  /**
   * 空文字・null・undefinedをチェック
   */
  isEmpty: (value: any): boolean => {
    return value === null || value === undefined || value === '';
  },

  /**
   * 文字列をサニタイズ（HTML エスケープ）
   */
  escapeHtml: (str: string): string => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * ランダムな文字列を生成
   */
  generateRandomString: (length: number = 8): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * 文字列内の検索ハイライト
   */
  highlightSearch: (text: string, search: string): string => {
    if (!search) return text;
    const regex = new RegExp(`(${search})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  },
};

// 日付関連のヘルパー関数
export const dateUtils = {
  /**
   * 日付をフォーマット
   */
  formatDate: (date: Date | string, formatString: string = DATE_FORMATS.DISPLAY): string => {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      if (!isValid(dateObj)) return '';
      return format(dateObj, formatString, { locale: ja });
    } catch {
      return '';
    }
  },

  /**
   * 相対時間をフォーマット
   */
  formatRelativeTime: (date: Date | string): string => {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      if (!isValid(dateObj)) return '';
      return formatDistanceToNow(dateObj, { addSuffix: true, locale: ja });
    } catch {
      return '';
    }
  },

  /**
   * 日付が今日かチェック
   */
  isToday: (date: Date | string): boolean => {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      const today = new Date();
      return dateObj.toDateString() === today.toDateString();
    } catch {
      return false;
    }
  },

  /**
   * 日付が過去かチェック
   */
  isPast: (date: Date | string): boolean => {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      return dateObj < new Date();
    } catch {
      return false;
    }
  },

  /**
   * 日付の差分を日数で取得
   */
  getDaysDifference: (date1: Date | string, date2: Date | string): number => {
    try {
      const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
      const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
      const timeDiff = Math.abs(d2.getTime() - d1.getTime());
      return Math.ceil(timeDiff / (1000 * 3600 * 24));
    } catch {
      return 0;
    }
  },
};

// 配列関連のヘルパー関数
export const arrayUtils = {
  /**
   * 配列から重複を除去
   */
  unique: <T>(array: T[], key?: keyof T): T[] => {
    if (!key) return [...new Set(array)];
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  },

  /**
   * 配列をグループ化
   */
  groupBy: <T>(array: T[], key: keyof T): Record<string, T[]> => {
    return array.reduce((groups, item) => {
      const group = String(item[key]);
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  },

  /**
   * 配列をソート
   */
  sortBy: <T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] => {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  },

  /**
   * 配列を分割
   */
  chunk: <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  /**
   * 配列から最大値・最小値を取得
   */
  minMax: <T>(array: T[], key: keyof T): { min: T | null; max: T | null } => {
    if (array.length === 0) return { min: null, max: null };
    
    let min = array[0];
    let max = array[0];
    
    for (const item of array) {
      if (item[key] < min[key]) min = item;
      if (item[key] > max[key]) max = item;
    }
    
    return { min, max };
  },
};

// オブジェクト関連のヘルパー関数
export const objectUtils = {
  /**
   * オブジェクトの深いコピー
   */
  deepClone: <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj));
  },

  /**
   * オブジェクトの深い比較
   */
  deepEqual: (obj1: any, obj2: any): boolean => {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  },

  /**
   * オブジェクトから空の値を除去
   */
  removeEmpty: (obj: Record<string, any>): Record<string, any> => {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, value]) => 
        value !== null && value !== undefined && value !== ''
      )
    );
  },

  /**
   * ネストしたプロパティを安全に取得
   */
  get: (obj: any, path: string, defaultValue?: any): any => {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result?.[key] === undefined) return defaultValue;
      result = result[key];
    }
    
    return result;
  },

  /**
   * オブジェクトをマージ
   */
  merge: <T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T => {
    return Object.assign({}, target, ...sources);
  },
};

// URL関連のヘルパー関数
export const urlUtils = {
  /**
   * クエリパラメータを追加
   */
  addQueryParams: (url: string, params: Record<string, any>): string => {
    const urlObj = new URL(url, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        urlObj.searchParams.set(key, String(value));
      }
    });
    return urlObj.toString();
  },

  /**
   * クエリパラメータを解析
   */
  parseQueryParams: (search: string = window.location.search): Record<string, string> => {
    const params = new URLSearchParams(search);
    const result: Record<string, string> = {};
    params.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  },

  /**
   * ファイル名からMIMEタイプを推測
   */
  getMimeType: (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'pdf': 'application/pdf',
      'csv': 'text/csv',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  },
};

// ビジネスロジック関連のヘルパー関数
export const businessUtils = {
  /**
   * 単価を計算
   */
  calculateUnitPrice: (price: number, quantity: number): number => {
    return numberUtils.safeDivide(price, quantity, 0);
  },

  /**
   * 利益率を計算
   */
  calculateProfitRate: (price: number, cost: number): number => {
    if (price <= 0) return 0;
    return numberUtils.round(((price - cost) / price) * 100, 1);
  },

  /**
   * 利益を計算
   */
  calculateProfit: (price: number, cost: number): number => {
    return Math.max(0, price - cost);
  },

  /**
   * ジャンル情報を取得
   */
  getGenreInfo: (genre: string) => {
    return GENRE_INFO[genre as keyof typeof GENRE_INFO] || {
      name: '不明',
      icon: '❓',
      color: '#9e9e9e',
      description: '不明なジャンル'
    };
  },

  /**
   * 利益率レベルを取得
   */
  getProfitLevel: (profitRate: number): 'high' | 'medium' | 'low' => {
    if (profitRate >= 30) return 'high';
    if (profitRate >= 15) return 'medium';
    return 'low';
  },

  /**
   * 価格の妥当性をチェック
   */
  validatePrice: (price: number, cost: number): {
    isValid: boolean;
    warnings: string[];
  } => {
    const warnings: string[] = [];
    
    if (price < cost) {
      warnings.push('販売価格が原価を下回っています');
    }
    
    const profitRate = businessUtils.calculateProfitRate(price, cost);
    if (profitRate < 10) {
      warnings.push('利益率が10%を下回っています');
    }
    
    return {
      isValid: warnings.length === 0,
      warnings,
    };
  },
};

// ファイル関連のヘルパー関数
export const fileUtils = {
  /**
   * ファイルサイズをフォーマット
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * ファイルをダウンロード
   */
  downloadFile: (data: Blob | string, filename: string, mimeType?: string): void => {
    const blob = typeof data === 'string' 
      ? new Blob([data], { type: mimeType || 'text/plain' })
      : data;
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * ファイルをBase64に変換
   */
  fileToBase64: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  },
};

// デバッグ用ヘルパー関数
export const debugUtils = {
  /**
   * コンソールログを整形して出力
   */
  log: (message: string, data?: any, type: 'info' | 'warn' | 'error' = 'info'): void => {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toLocaleTimeString();
      const prefix = `[${timestamp}] ${message}`;
      
      if (data) {
        console[type](prefix, data);
      } else {
        console[type](prefix);
      }
    }
  },

  /**
   * パフォーマンス測定
   */
  measurePerformance: <T>(name: string, fn: () => T): T => {
    if (process.env.NODE_ENV === 'development') {
      const start = performance.now();
      const result = fn();
      const end = performance.now();
      console.log(`${name}: ${end - start}ms`);
      return result;
    }
    return fn();
  },
};

// エクスポート
export {
  numberUtils,
  stringUtils,
  dateUtils,
  arrayUtils,
  objectUtils,
  urlUtils,
  businessUtils,
  fileUtils,
  debugUtils,
};

export default {
  numberUtils,
  stringUtils,
  dateUtils,
  arrayUtils,
  objectUtils,
  urlUtils,
  businessUtils,
  fileUtils,
  debugUtils,
};
