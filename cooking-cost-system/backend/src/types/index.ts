// ================================
// 基本的な型定義
// ================================

export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
}

export interface PaginationQuery {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

// ================================
// APIレスポンス型定義
// ================================

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
    path: string;
    method: string;
    code?: string;
    stack?: string;
}

export interface SuccessResponse<T = any> {
    success: true;
    data: T;
    message?: string;
    timestamp: string;
    count?: number;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// ================================
// データベース関連型定義
// ================================

export interface BaseEntity {
    id?: number;
    created_at?: Date | string;
    updated_at?: Date | string;
}

export interface DatabaseConnection {
    query<T = any>(sql: string, params?: any[]): Promise<T[]>;
    queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
    transaction<T>(callback: (query: QueryFunction) => Promise<T>): Promise<T>;
    testConnection(): Promise<boolean>;
    close(): Promise<void>;
}

export type QueryFunction = (sql: string, params?: any[]) => Promise<any[]>;

// ================================
// 食材関連型定義
// ================================

export type GenreType = 'meat' | 'vegetable' | 'seasoning' | 'sauce' | 'frozen' | 'drink';

export interface Ingredient extends BaseEntity {
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

export interface UpdateIngredientRequest extends Partial<CreateIngredientRequest> {}

export interface IngredientSearchParams {
    name?: string;
    store?: string;
    genre?: GenreType;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'name' | 'price' | 'unit_price' | 'created_at';
    sortOrder?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
}

export interface IngredientUsageStats {
    id: number;
    name: string;
    genre: GenreType;
    unit_price: number;
    usage_count: number;
    total_used_quantity: number;
    total_used_cost: number;
    avg_used_quantity: number;
    avg_used_cost: number;
}

// ================================
// 料理関連型定義
// ================================

export interface DishIngredient {
    ingredient_id: number;
    used_quantity: number;
    used_cost?: number;
    ingredient?: Ingredient;
}

export interface Dish extends BaseEntity {
    name: string;
    total_cost: number;
    genre: string;
    description?: string;
    ingredients?: DishIngredient[];
}

export interface CreateDishRequest {
    name: string;
    genre?: string;
    description?: string;
    ingredients: DishIngredient[];
}

export interface UpdateDishRequest extends Partial<CreateDishRequest> {}

export interface DishSearchParams {
    name?: string;
    genre?: string;
    minCost?: number;
    maxCost?: number;
    sortBy?: 'name' | 'total_cost' | 'created_at';
    sortOrder?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
}

export interface DishCostDetails {
    id: number;
    name: string;
    genre: string;
    total_cost: number;
    ingredient_count: number;
    ingredient_details: string;
}

// ================================
// 完成品関連型定義
// ================================

export type UsageUnitType = 'ratio' | 'serving';

export interface FoodDish {
    dish_id: number;
    usage_quantity: number;
    usage_unit: UsageUnitType;
    usage_cost?: number;
    description?: string;
    dish?: Dish;
}

export interface CompletedFood extends BaseEntity {
    name: string;
    price?: number;
    total_cost: number;
    description?: string;
    dishes?: FoodDish[];
    profit?: number;
    profit_rate?: number;
}

export interface CreateCompletedFoodRequest {
    name: string;
    price?: number;
    description?: string;
    dishes: FoodDish[];
}

export interface UpdateCompletedFoodRequest extends Partial<CreateCompletedFoodRequest> {}

export interface CompletedFoodSearchParams {
    name?: string;
    minPrice?: number;
    maxPrice?: number;
    minCost?: number;
    maxCost?: number;
    sortBy?: 'name' | 'price' | 'total_cost' | 'created_at';
    sortOrder?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
}

export interface FoodProfitAnalysis {
    id: number;
    name: string;
    price?: number;
    total_cost: number;
    profit?: number;
    profit_rate?: number;
    dish_count: number;
    dish_details: string;
}

// ================================
// メモ関連型定義
// ================================

export interface Memo extends BaseEntity {
    content: string;
}

export interface CreateMemoRequest {
    content: string;
}

export interface UpdateMemoRequest {
    content: string;
}

// ================================
// ユーザー関連型定義
// ================================

export type UserRole = 'admin' | 'user';

export interface User extends BaseEntity {
    username: string;
    email: string;
    role: UserRole;
    is_active: boolean;
    last_login_at?: Date | string;
}

export interface CreateUserRequest {
    username: string;
    email: string;
    password: string;
    role?: UserRole;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    user: Omit<User, 'password_hash'>;
    token: string;
    expiresAt: Date;
}

// ================================
// レポート関連型定義
// ================================

export interface DashboardStats {
    summary: {
        totalIngredients: number;
        totalDishes: number;
        totalCompletedFoods: number;
        avgProfitRate: string;
        totalRevenue: number;
        totalCost: number;
        totalProfit: number;
    };
    recentActivity: ActivityItem[];
}

export interface ActivityItem {
    id: number;
    type: 'ingredient' | 'dish' | 'food';
    message: string;
    timestamp: Date | string;
}

export interface GenreStatistics {
    genre: string;
    count: number;
    avg_unit_price?: number;
    min_unit_price?: number;
    max_unit_price?: number;
    total_purchase_cost?: number;
    avg_total_cost?: number;
    min_total_cost?: number;
    max_total_cost?: number;
}

export interface CostTrend {
    date: string;
    avg_ingredient_cost?: number;
    ingredient_count?: number;
    avg_dish_cost?: number;
    dish_count?: number;
    avg_food_cost?: number;
    avg_profit_rate?: number;
    food_count?: number;
}

export interface PopularItem {
    id: number;
    name: string;
    store?: string;
    genre: string;
    usage_count: number;
    avg_used_quantity: number;
    total_used_cost: number;
}

// ================================
// ファイルアップロード関連型定義
// ================================

export interface UploadedFile {
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
    path: string;
    url: string;
}

export interface FileListItem {
    filename: string;
    size: number;
    created: Date;
    modified: Date;
    url: string;
}

// ================================
// 認証・セキュリティ関連型定義
// ================================

export interface AuthenticatedRequest extends Request {
    user?: User;
    token?: string;
}

export interface JWTPayload {
    userId: number;
    username: string;
    role: UserRole;
    iat: number;
    exp: number;
}

export interface Session {
    id: string;
    user_id?: number;
    data?: string;
    expires_at: Date;
    created_at: Date;
}

// ================================
// 監査ログ関連型定義
// ================================

export interface AuditLog extends BaseEntity {
    user_id?: number;
    action: string;
    table_name: string;
    record_id: number;
    old_values?: Record<string, any>;
    new_values?: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
}

// ================================
// バリデーション関連型定義
// ================================

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

export interface ValidatorOptions {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    customValidator?: (value: any) => boolean | Promise<boolean>;
}

// ================================
// 設定関連型定義
// ================================

export interface AppConfig {
    env: string;
    port: number;
    database: DatabaseConfig;
    jwt: {
        secret: string;
        expiresIn: string;
    };
    upload: {
        maxFileSize: number;
        allowedTypes: string[];
        uploadDir: string;
    };
    logging: {
        level: string;
        maxFiles: string;
        maxSize: string;
    };
    cors: {
        origins: string[];
        credentials: boolean;
    };
    rateLimit: {
        windowMs: number;
        max: number;
    };
}

// ================================
// エクスポート型定義
// ================================

export interface ExportOptions {
    format: 'json' | 'csv' | 'xlsx';
    type: 'ingredients' | 'dishes' | 'foods' | 'summary';
    dateRange?: {
        start: Date;
        end: Date;
    };
    filters?: Record<string, any>;
}

// ================================
// ヘルスチェック関連型定義
// ================================

export interface HealthCheckResult {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    uptime: number;
    environment: string;
    version: string;
    memory: {
        used: string;
        total: string;
        rss: string;
    };
    cpu: NodeJS.CpuUsage;
    platform: {
        arch: string;
        platform: string;
        node: string;
    };
    checks?: {
        database: string;
        memory: string;
        uptime: string;
        environment: string;
    };
    info?: Record<string, any>;
}

// ================================
// エラー関連型定義
// ================================

export interface CustomError extends Error {
    statusCode?: number;
    code?: string;
    details?: any;
    isOperational?: boolean;
}

export interface DatabaseError extends CustomError {
    query?: string;
    parameters?: any[];
    constraint?: string;
}

// ================================
// ユーティリティ型定義
// ================================

export type Partial<T> = {
    [P in keyof T]?: T[P];
};

export type Required<T> = {
    [P in keyof T]-?: T[P];
};

export type Pick<T, K extends keyof T> = {
    [P in K]: T[P];
};

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type RecursivePartial<T> = {
    [P in keyof T]?: T[P] extends object ? RecursivePartial<T[P]> : T[P];
};

// ================================
// デフォルトエクスポート
// ================================

export default {
    GenreType,
    UsageUnitType,
    UserRole,
    ValidationError,
    ErrorResponse,
    SuccessResponse,
    ApiResponse,
    Ingredient,
    Dish,
    CompletedFood,
    Memo,
    User,
    DashboardStats,
    HealthCheckResult,
    CustomError,
};
