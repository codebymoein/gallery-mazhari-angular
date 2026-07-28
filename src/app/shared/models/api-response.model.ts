/**
 * API Response Models
 * Standard response formats and error handling
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  status?: number;
}

export interface PaginationMeta {
  current_page: number;
  total_pages: number;
  total_items: number;
  per_page: number;
  has_more: boolean;
  links?: PaginationLinks;
}

export interface PaginationLinks {
  first: string;
  last: string;
  prev?: string;
  next?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  data?: {
    status: number;
    params?: any;
  };
}

export class ApiException extends Error {
  constructor(
    public code: string,
    public status: number,
    public details?: any
  ) {
    super(code);
    this.name = 'ApiException';
  }
}

export enum ApiErrorCode {
  // Client Errors
  BAD_REQUEST = 'bad_request',
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  VALIDATION_FAILED = 'validation_failed',

  // Server Errors
  INTERNAL_ERROR = 'internal_error',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  BAD_GATEWAY = 'bad_gateway',

  // Network Errors
  NETWORK_ERROR = 'network_error',
  TIMEOUT = 'timeout',
  OFFLINE = 'offline',

  // Custom Errors
  INVALID_TOKEN = 'invalid_token',
  TOKEN_EXPIRED = 'token_expired',
  RESOURCE_DELETED = 'resource_deleted',
  UNKNOWN = 'unknown'
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationErrorResponse {
  code: string;
  message: string;
  errors: ValidationError[];
}
