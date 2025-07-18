// 共通型定義

export interface BaseModel {
    id?: number;
    created_at?: Date | string;
    updated_at?: Date | string;
}

export interface PaginationParams {
    page?: number;
    limit?: number;
    offset?: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    timestamp: string;
}

export interface ValidationError {
    field: string;
    message: string;
    value?: any;
}

export interface ErrorResponse {
    success: false;
    error: string;
    message: string;
    details?: ValidationError[];
    timestamp: string;
    path?: string;
    method?: string;
}

  // 食材関連
export type GenreType = 'meat' | 'vegetable' | 'seasoning' | 'sauce' | 'frozen' | 'drink';

export interface Ingredient extends BaseModel {
    name: string;
    store: string;
    quantity: number;
    unit: string;
    price: number;
    unit_price: number;
    genre: GenreType;
}

export interface CreateIngredientRequest {
    name: string;
    store: string;
    quantity: number;
    unit: string;
    price: number;
    genre: GenreType;
}

export interface UpdateIngredientRequest extends Partial<CreateIngredientRequest> {
    id: number;
}

export interface IngredientSearchParams {
    name?: string;
    store?: string;
    genre?: GenreType;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'name' | 'price' | 'unit_price' | 'created_at';
    sortOrder?: 'asc' | 'desc';
}

  // 料理関連
export interface Dish extends BaseModel {
    name: string;
    total_cost: number;
    genre: string;
    description?: string;
    ingredients?: DishIngredient[];
}

export interface DishIngredient {
    id?: number;
    dish_id: number;
    ingredient_id: number;
    ingredient?: Ingredient;
    used_quantity: number;
    used_cost: number;
    created_at?: Date | string;
}

export interface CreateDishRequest {
    name: string;
    description?: string;
    ingredients: {
        ingredient_id: number;
        used_quantity: number;
    }[];
}

export interface UpdateDishRequest extends Partial<CreateDishRequest> {
    id: number;
}

export interface DishSearchParams {
    name?: string;
    genre?: string;
    minCost?: number;
    maxCost?: number;
    sortBy?: 'name' | 'total_cost' | 'created_at';
    sortOrder?: 'asc' | 'desc';
}

  // 完成品関連
export interface CompletedFood extends BaseModel {
    name: string;
    price?: number;
    total_cost: number;
    description?: string;
    dishes?: FoodDish[];
    profit?: number;
    profit_rate?: number;
}

export interface FoodDish {
    id?: number;
    food_id: number;
    dish_id: number;
    dish?: Dish;
    usage_quantity: number;
    usage_unit: 'ratio' | 'serving';
    usage_cost: number;
    description?: string;
    created_at?: Date | string;
}

export interface CreateCompletedFoodRequest {
    name: string;
    price?: number;
    description?: string;
    dishes: {
        dish_id: number;
        usage_quantity: number;
        usage_unit: 'ratio' | 'serving';
        description?: string;
    }[];
}

export interface UpdateCompletedFoodRequest extends Partial<CreateCompletedFoodRequest> {
    id: number;
}

export interface CompletedFoodSearchParams {
    name?: string;
    minPrice?: number;
    maxPrice?: number;
    minCost?: number;
    maxCost?: number;
    sortBy?: 'name' | 'price' | 'total_cost' | 'created_at';
    sortOrder?: 'asc' | 'desc';
}

  // メモ関連
export interface Memo extends BaseModel {
    content: string;
}

export interface CreateMemoRequest {
    content: string;
}

export interface UpdateMemoRequest {
    id: number;
    content: string;
}

  // レポート関連
export interface GenreStatistics {
    genre: GenreType;
    ingredient_count: number;
    avg_unit_price: number;
    min_unit_price: number;
    max_unit_price: number;
    total_purchase_cost: number;
}

export interface DishStatistics {
    genre: string;
    dish_count: number;
    avg_total_cost: number;
    min_total_cost: number;
    max_total_cost: number;
}

export interface PopularIngredient {
    id: number;
    name: string;
    store: string;
    genre: GenreType;
    usage_count: number;
    avg_used_quantity: number;
    total_used_cost: number;
}

export interface CostTrend {
    date: string;
    avg_ingredient_cost: number;
    avg_dish_cost: number;
    avg_food_cost: number;
    total_items: number;
}

export interface ReportData {
    genreStatistics: GenreStatistics[];
    dishStatistics: DishStatistics[];
    popularIngredients: PopularIngredient[];
    costTrends: CostTrend[];
    summary: {
        totalIngredients: number;
        totalDishes: number;
        totalCompletedFoods: number;
        avgProfitRate: number;
        totalRevenue: number;
        totalCost: number;
        totalProfit: number;
    };
}

  // 認証関連
export interface User extends BaseModel {
    username: string;
    email: string;
    role: 'admin' | 'user';
    is_active: boolean;
    last_login?: Date | string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    user: User;
    token: string;
    expiresAt: Date | string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

  // UI関連
export interface ToastMessage {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    duration?: number;
}

export interface LoadingState {
    isLoading: boolean;
    message?: string;
}

export interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    severity?: 'info' | 'warning' | 'error';
}

export interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    fullWidth?: boolean;
}

  // ドラッグ&ドロップ関連
export interface DragItem {
    type: 'ingredient' | 'dish' | 'food';
    item: Ingredient | Dish | CompletedFood;
    id: number;
}

export interface DropResult {
    type: 'ingredient' | 'dish' | 'food';
    targetType: 'dish_builder' | 'food_builder' | 'floating_area';
    item: Ingredient | Dish | CompletedFood;
}

  // フィルター関連
export interface FilterState {
    search: string;
    genre?: GenreType;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    minPrice?: number;
    maxPrice?: number;
}

export interface SortOption {
    value: string;
    label: string;
}

  // テーブル関連
export interface TableColumn<T = any> {
    id: keyof T;
    label: string;
    sortable?: boolean;
    align?: 'left' | 'center' | 'right';
    width?: number;
    render?: (value: any, row: T) => React.ReactNode;
}

export interface TableProps<T = any> {
    data: T[];
    columns: TableColumn<T>[];
    loading?: boolean;
    pagination?: PaginatedResponse<T>['pagination'];
    onPageChange?: (page: number) => void;
    onRowClick?: (row: T) => void;
    selectedRows?: T[];
    onSelectionChange?: (rows: T[]) => void;
}

  // フォーム関連
export interface FormFieldProps {
    name: string;
    label: string;
    type?: 'text' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio';
    options?: { value: any; label: string }[];
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    helperText?: string;
    error?: boolean;
    multiline?: boolean;
    rows?: number;
    startAdornment?: React.ReactNode;
    endAdornment?: React.ReactNode;
}

  // チャート関連
export interface ChartData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor?: string | string[];
        borderColor?: string | string[];
        borderWidth?: number;
    }[];
}

export interface ChartProps {
    data: ChartData;
    title?: string;
    type?: 'bar' | 'line' | 'pie' | 'doughnut';
    height?: number;
    options?: any;
}

  // 設定関連
export interface AppSettings {
    theme: 'light' | 'dark';
    language: 'ja' | 'en';
    currency: string;
    decimalPlaces: number;
    autoSave: boolean;
    notifications: boolean;
    soundEnabled: boolean;
}

  // 定数
export const GENRE_INFO = {
    meat: { name: '肉類', icon: '🥩', color: '#d32f2f' },
    vegetable: { name: '野菜', icon: '🥬', color: '#388e3c' },
    seasoning: { name: '調味料', icon: '🧂', color: '#fbc02d' },
    sauce: { name: 'ソース', icon: '🍅', color: '#ff5722' },
    frozen: { name: '冷凍', icon: '🧊', color: '#2196f3' },
    drink: { name: 'ドリンク', icon: '🥤', color: '#9c27b0' },
} as const;

export const USAGE_UNIT_INFO = {
    ratio: { name: '割合', description: '料理の一部として使用', icon: '📊' },
    serving: { name: '人前', description: '1人前として提供', icon: '🍽️' },
} as const;

export const SORT_OPTIONS = {
    name: '名前',
    price: '価格',
    total_cost: '原価',
    unit_price: '単価',
    created_at: '作成日',
} as const;

  // アプリケーション状態
export interface AppState {
    user: User | null;
    isAuthenticated: boolean;
    settings: AppSettings;
    loading: LoadingState;
    toast: ToastMessage[];
    modal: {
        open: boolean;
        type: string;
        data?: any;
    };
    filters: {
        ingredients: FilterState;
        dishes: FilterState;
        completedFoods: FilterState;
    };
}

  // API エラー
export interface ApiError {
    message: string;
    status: number;
    data?: any;
}

  // カスタムフック関連
export interface UseApiOptions<T = any> {
    enabled?: boolean;
    refetchOnWindowFocus?: boolean;
    retry?: number;
    onSuccess?: (data: T) => void;
    onError?: (error: ApiError) => void;
}

export interface UseMutationOptions<T = any, V = any> {
    onSuccess?: (data: T) => void;
    onError?: (error: ApiError) => void;
    onSettled?: () => void;
    invalidateQueries?: string[];
}

  // ファイルアップロード関連
export interface UploadResult {
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
    path: string;
    url: string;
}

export interface FileUploadProps {
    accept?: string;
    multiple?: boolean;
    maxSize?: number;
    onUpload?: (files: File[]) => void;
    onSuccess?: (results: UploadResult[]) => void;
    onError?: (error: string) => void;
    disabled?: boolean;
    children?: React.ReactNode;
}

  // 検索関連
export interface SearchResult<T = any> {
    items: T[];
    total: number;
    query: string;
    filters: any;
    took: number;
}

export interface SearchOptions {
    query?: string;
    filters?: any;
    sort?: string;
    page?: number;
    limit?: number;
}

  // 通知関連
export interface NotificationSettings {
    email: boolean;
    browser: boolean;
    sound: boolean;
    types: {
        ingredient_added: boolean;
        dish_created: boolean;
        food_completed: boolean;
        low_stock: boolean;
        system_updates: boolean;
    };
}

  // エクスポート関連
export interface ExportOptions {
    format: 'csv' | 'xlsx' | 'json' | 'pdf';
    fields?: string[];
    filters?: any;
    filename?: string;
}

  // 統計関連
export interface StatCard {
    title: string;
    value: string | number;
    change?: number;
    trend?: 'up' | 'down' | 'stable';
    icon?: React.ReactNode;
    color?: string;
}

export interface DashboardStats {
    totalIngredients: number;
    totalDishes: number;
    totalCompletedFoods: number;
    avgProfitRate: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    recentActivity: Array<{
        id: number;
        type: string;
        message: string;
        timestamp: string;
    }>;
}

  // バリデーション関連
export interface ValidationRules {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null;
}

export interface FormValidation {
    [key: string]: ValidationRules;
}

  // 多言語対応
export interface LocaleMessage {
    [key: string]: string | LocaleMessage;
}

export interface Locale {
    code: string;
    name: string;
    messages: LocaleMessage;
}

  // PWA関連
export interface PWAInstallPrompt {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

  // パフォーマンス関連
export interface PerformanceMetrics {
    loadTime: number;
    renderTime: number;
    memoryUsage: number;
    apiResponseTime: number;
}

  // アクセシビリティ関連
export interface A11yOptions {
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
    screenReader: boolean;
    keyboardNavigation: boolean;
}