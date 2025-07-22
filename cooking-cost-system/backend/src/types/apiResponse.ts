export interface ValidationError {
    field: string;
    message: string;
    value?: any;
}

export interface ErrorResponse {
    success: false;
    message: string;
    errors?: ValidationError[];
    code?: string;
    statusCode?: number;
}

export interface SuccessResponse<T = any> {
    success: true;
    data: T;
    message?: string;
}

export type ApiResponseType<T = any> = SuccessResponse<T> | ErrorResponse;