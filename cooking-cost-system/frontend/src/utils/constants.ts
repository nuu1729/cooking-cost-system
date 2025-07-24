// アプリケーション定数

// API関連
export const API_ENDPOINTS = {
  INGREDIENTS: '/ingredients',
  DISHES: '/dishes',
  COMPLETED_FOODS: '/foods',
  REPORTS: '/reports',
  MEMO: '/memo',
  UPLOAD: '/upload',
  AUTH: '/auth',
  HEALTH: '/health',
} as const;

// ページネーション
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  PAGES_TO_SHOW: 5,
} as const;

// ソート設定
export const SORT_ORDERS = {
  ASC: 'asc' as const,
  DESC: 'desc' as const,
} as const;

export const SORT_FIELDS = {
  INGREDIENTS: {
    NAME: 'name',
    PRICE: 'price',
    UNIT_PRICE: 'unit_price',
    STORE: 'store',
    GENRE: 'genre',
    CREATED_AT: 'created_at',
  },
  DISHES: {
    NAME: 'name',
    TOTAL_COST: 'total_cost',
    GENRE: 'genre',
    CREATED_AT: 'created_at',
  },
  COMPLETED_FOODS: {
    NAME: 'name',
    PRICE: 'price',
    TOTAL_COST: 'total_cost',
    PROFIT: 'profit',
    PROFIT_RATE: 'profit_rate',
    CREATED_AT: 'created_at',
  },
} as const;

// ジャンル情報
export const GENRE_INFO = {
  meat: { 
    name: '肉類', 
    icon: '🥩', 
    color: '#d32f2f',
    description: '牛肉、豚肉、鶏肉など'
  },
  vegetable: { 
    name: '野菜', 
    icon: '🥬', 
    color: '#388e3c',
    description: '野菜類、きのこ類など'
  },
  seasoning: { 
    name: '調味料', 
    icon: '🧂', 
    color: '#fbc02d',
    description: '塩、醤油、味噌など'
  },
  sauce: { 
    name: 'ソース', 
    icon: '🍅', 
    color: '#ff5722',
    description: 'ケチャップ、ソース類など'
  },
  frozen: { 
    name: '冷凍', 
    icon: '🧊', 
    color: '#2196f3',
    description: '冷凍食品、冷凍野菜など'
  },
  drink: { 
    name: 'ドリンク', 
    icon: '🥤', 
    color: '#9c27b0',
    description: '飲み物、アルコール類など'
  },
} as const;

// 使用単位情報
export const USAGE_UNIT_INFO = {
  ratio: { 
    name: '割合', 
    description: '料理の一部として使用', 
    icon: '📊',
    example: '0.5（半分）'
  },
  serving: { 
    name: '人前', 
    description: '1人前として提供', 
    icon: '🍽️',
    example: '1（1人前）'
  },
} as const;

// 通貨設定
export const CURRENCY = {
  SYMBOL: '¥',
  CODE: 'JPY',
  DECIMAL_PLACES: 0,
  THOUSAND_SEPARATOR: ',',
} as const;

// 日付フォーマット
export const DATE_FORMATS = {
  DISPLAY: 'yyyy/MM/dd',
  DISPLAY_WITH_TIME: 'yyyy/MM/dd HH:mm',
  API: 'yyyy-MM-dd',
  API_WITH_TIME: 'yyyy-MM-ddTHH:mm:ss',
  RELATIVE_TIME_THRESHOLD: 7 * 24 * 60 * 60 * 1000, // 7日
} as const;

// バリデーション
export const VALIDATION = {
  INGREDIENT: {
    NAME_MAX_LENGTH: 255,
    STORE_MAX_LENGTH: 100,
    UNIT_MAX_LENGTH: 20,
    QUANTITY_MIN: 0.01,
    QUANTITY_MAX: 99999,
    PRICE_MIN: 0.01,
    PRICE_MAX: 999999,
  },
  DISH: {
    NAME_MAX_LENGTH: 255,
    DESCRIPTION_MAX_LENGTH: 1000,
    MIN_INGREDIENTS: 1,
    MAX_INGREDIENTS: 50,
  },
  COMPLETED_FOOD: {
    NAME_MAX_LENGTH: 255,
    DESCRIPTION_MAX_LENGTH: 1000,
    PRICE_MIN: 0,
    PRICE_MAX: 999999,
    MIN_DISHES: 1,
    MAX_DISHES: 20,
  },
  MEMO: {
    CONTENT_MAX_LENGTH: 5000,
  },
} as const;

// ファイルアップロード
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: {
    IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    DOCUMENTS: ['application/pdf', 'text/csv', 'application/vnd.ms-excel'],
    ALL: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/csv'],
  },
  EXTENSIONS: {
    IMAGES: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    DOCUMENTS: ['.pdf', '.csv', '.xls', '.xlsx'],
  },
} as const;

// UI設定
export const UI_CONFIG = {
  DRAWER_WIDTH: 240,
  HEADER_HEIGHT: 64,
  FOOTER_HEIGHT: 48,
  CARD_ELEVATION: 2,
  MODAL_Z_INDEX: 1300,
  TOAST_DURATION: {
    SUCCESS: 3000,
    ERROR: 5000,
    WARNING: 4000,
    INFO: 4000,
  },
  DEBOUNCE_DELAY: {
    SEARCH: 300,
    AUTO_SAVE: 1000,
    RESIZE: 100,
  },
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
} as const;

// ローカルストレージキー
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  LANGUAGE: 'language',
  FILTERS: {
    INGREDIENTS: 'filters_ingredients',
    DISHES: 'filters_dishes',
    COMPLETED_FOODS: 'filters_completed_foods',
  },
  DRAFT: {
    INGREDIENT: 'draft_ingredient',
    DISH: 'draft_dish',
    COMPLETED_FOOD: 'draft_completed_food',
  },
  SETTINGS: 'app_settings',
  LAYOUT: 'layout_preferences',
} as const;

// デフォルト設定
export const DEFAULT_SETTINGS = {
  THEME: 'light' as const,
  LANGUAGE: 'ja' as const,
  CURRENCY: CURRENCY.CODE,
  AUTO_SAVE: true,
  NOTIFICATIONS: true,
  SOUND_ENABLED: true,
  COMPACT_MODE: false,
  SHOW_TOOLTIPS: true,
} as const;

// エラーメッセージ
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
  SERVER_ERROR: 'サーバーエラーが発生しました',
  VALIDATION_ERROR: '入力内容に問題があります',
  UNAUTHORIZED: 'ログインが必要です',
  FORBIDDEN: 'この操作を実行する権限がありません',
  NOT_FOUND: 'データが見つかりません',
  CONFLICT: 'データが競合しています',
  FILE_TOO_LARGE: 'ファイルサイズが大きすぎます',
  INVALID_FILE_TYPE: 'サポートされていないファイル形式です',
  UPLOAD_FAILED: 'ファイルのアップロードに失敗しました',
} as const;

// 成功メッセージ
export const SUCCESS_MESSAGES = {
  INGREDIENT_CREATED: '食材を追加しました',
  INGREDIENT_UPDATED: '食材を更新しました',
  INGREDIENT_DELETED: '食材を削除しました',
  DISH_CREATED: '料理を作成しました',
  DISH_UPDATED: '料理を更新しました',
  DISH_DELETED: '料理を削除しました',
  COMPLETED_FOOD_CREATED: '完成品を登録しました',
  COMPLETED_FOOD_UPDATED: '完成品を更新しました',
  COMPLETED_FOOD_DELETED: '完成品を削除しました',
  MEMO_SAVED: 'メモを保存しました',
  FILE_UPLOADED: 'ファイルをアップロードしました',
  EXPORT_COMPLETED: 'エクスポートが完了しました',
  SETTINGS_SAVED: '設定を保存しました',
} as const;

// APIレスポンスコード
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Query Keys（React Query用）
export const QUERY_KEYS = {
  INGREDIENTS: ['ingredients'] as const,
  INGREDIENT_DETAIL: (id: number) => ['ingredients', id] as const,
  DISHES: ['dishes'] as const,
  DISH_DETAIL: (id: number) => ['dishes', id] as const,
  COMPLETED_FOODS: ['completedFoods'] as const,
  COMPLETED_FOOD_DETAIL: (id: number) => ['completedFoods', id] as const,
  REPORTS: ['reports'] as const,
  DASHBOARD: ['dashboard'] as const,
  MEMO: ['memo'] as const,
  GENRE_STATS: ['genreStats'] as const,
  POPULAR_ITEMS: ['popularItems'] as const,
  COST_TRENDS: ['costTrends'] as const,
  HEALTH: ['health'] as const,
} as const;

// 正規表現パターン
export const REGEX_PATTERNS = {
  EMAIL: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  PHONE: /^[0-9-]+$/,
  NUMERIC: /^\d+(\.\d+)?$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  JAPANESE: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/,
} as const;

// 単位の変換表
export const UNIT_CONVERSIONS = {
  WEIGHT: {
    'kg': 1000,
    'g': 1,
    'mg': 0.001,
  },
  VOLUME: {
    'L': 1000,
    'ml': 1,
    'cc': 1,
  },
  COUNT: {
    '個': 1,
    '本': 1,
    '枚': 1,
    'パック': 1,
  },
} as const;

// ブレークポイント
export const BREAKPOINTS = {
  XS: 0,
  SM: 600,
  MD: 900,
  LG: 1200,
  XL: 1536,
} as const;

// Z-Index階層
export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  NOTIFICATION: 1080,
} as const;

// カラーパレット（テーマ以外の色）
export const COLORS = {
  PROFIT: {
    HIGH: '#4caf50',    // 30%以上
    MEDIUM: '#ff9800',  // 15-30%
    LOW: '#f44336',     // 15%未満
  },
  STATUS: {
    ACTIVE: '#4caf50',
    INACTIVE: '#9e9e9e',
    PENDING: '#ff9800',
    ERROR: '#f44336',
  },
  CHART: [
    '#1976d2', '#388e3c', '#fbc02d', '#ff5722',
    '#9c27b0', '#00acc1', '#ff9800', '#795548',
    '#607d8b', '#e91e63', '#cddc39', '#ff5722',
  ],
} as const;

export default {
  API_ENDPOINTS,
  PAGINATION,
  SORT_ORDERS,
  SORT_FIELDS,
  GENRE_INFO,
  USAGE_UNIT_INFO,
  CURRENCY,
  DATE_FORMATS,
  VALIDATION,
  FILE_UPLOAD,
  UI_CONFIG,
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  HTTP_STATUS,
  QUERY_KEYS,
  REGEX_PATTERNS,
  UNIT_CONVERSIONS,
  BREAKPOINTS,
  Z_INDEX,
  COLORS,
};
