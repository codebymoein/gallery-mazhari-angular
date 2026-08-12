/**
 * API Interceptor
 * Handles HTTP requests/responses globally
 */

import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
  HttpResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '@env/environment';

interface ApiInterceptorError {
  code: string;
  message: string;
  status: number;
  details: unknown;
  timestamp: string;
}

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  /**
   * Intercept HTTP requests and responses
   */
  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // Clone request and add headers
    const clonedReq = this.addHeaders(req);

    return next.handle(clonedReq).pipe(
      // Log responses in development only
      tap((event: HttpEvent<unknown>) => {
        if (environment.debug.api && event instanceof HttpResponse) {
          console.debug('[ApiInterceptor] Response:', {
            url: event.url,
            status: event.status,
            timestamp: new Date().toISOString()
          });
        }
      }),

      // Handle errors
      catchError((error: HttpErrorResponse) => {
        if (environment.debug.api) {
          console.error('[ApiInterceptor] Error:', {
            url: error.url,
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            timestamp: new Date().toISOString()
          });
        }

        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Add headers to requests
   */
  private addHeaders(req: HttpRequest<unknown>): HttpRequest<unknown> {
    let headers = req.headers;

    // Never set Content-Type for FormData. The browser must generate the
    // multipart boundary; forcing application/json makes ZIP/image uploads fail.
    const isFormData =
      typeof FormData !== 'undefined' && req.body instanceof FormData;
    if (!headers.has('Content-Type') && req.method !== 'GET' && !isFormData) {
      headers = headers.set('Content-Type', 'application/json');
    }

    // Add Accept header
    if (!headers.has('Accept')) {
      headers = headers.set('Accept', 'application/json');
    }

    // Add language header (for Persian support)
    headers = headers.set('Accept-Language', 'fa-IR,fa;q=0.9,en;q=0.8');

    // Add auth token if available (for future use)
    const token = this.getAuthToken();
    if (token && (this.isWpJsonUrl(req.url) || this.isBackendUrl(req.url))) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return req.clone({
      headers,
      withCredentials: this.isBackendUrl(req.url) ? true : req.withCredentials
    });
  }

  /**
   * Handle errors globally
   */
  private handleError(error: HttpErrorResponse): ApiInterceptorError {
    let errorMessage = 'An error occurred';
    let errorCode = 'UNKNOWN_ERROR';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message || 'Network error occurred';
      errorCode = 'NETWORK_ERROR';
    } else {
      // Server-side error
      switch (error.status) {
        case 0:
          errorMessage = 'Network error - unable to reach server';
          errorCode = 'NETWORK_ERROR';
          break;

        case 400:
          errorMessage = error.error?.message || 'Bad request';
          errorCode = 'BAD_REQUEST';
          break;

        case 401:
          errorMessage = 'Unauthorized - please login';
          errorCode = 'UNAUTHORIZED';
          // Could dispatch logout action here
          break;

        case 403:
          errorMessage = 'Forbidden - access denied';
          errorCode = 'FORBIDDEN';
          break;

        case 404:
          errorMessage = 'Resource not found';
          errorCode = 'NOT_FOUND';
          break;

        case 408:
          errorMessage = 'Request timeout - please try again';
          errorCode = 'TIMEOUT';
          break;

        case 429:
          errorMessage = 'Too many requests - please wait';
          errorCode = 'RATE_LIMIT';
          break;

        case 500:
          errorMessage = 'Internal server error';
          errorCode = 'INTERNAL_ERROR';
          break;

        case 502:
          errorMessage = 'Bad gateway - server temporarily unavailable';
          errorCode = 'BAD_GATEWAY';
          break;

        case 503:
          errorMessage = 'Service unavailable';
          errorCode = 'SERVICE_UNAVAILABLE';
          break;

        default:
          errorMessage = `Server error: ${error.statusText || 'Unknown error'}`;
          errorCode = 'SERVER_ERROR';
      }
    }

    // Return structured error object
    return {
      code: errorCode,
      message: errorMessage,
      status: error.status,
      details: error.error,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check if URL is WordPress API endpoint
   */
  private isWpJsonUrl(url: string): boolean {
    return url.includes('/wp-json/');
  }

  private isBackendUrl(url: string): boolean {
    return url.startsWith(environment.backendApiBaseUrl);
  }

  /**
   * Get authentication token from storage
   * (Can be extended based on authentication strategy)
   */
  private getAuthToken(): string | null {
    try {
      const auth = localStorage.getItem('auth_token');
      return auth ? JSON.parse(auth).token : null;
    } catch {
      return null;
    }
  }
}
