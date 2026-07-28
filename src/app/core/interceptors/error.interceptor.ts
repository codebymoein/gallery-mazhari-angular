/**
 * Error Interceptor
 * Global error handling and user notifications
 */

import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  private handleError(error: HttpErrorResponse): void {
    // Handle specific error scenarios
    if (error.status === 0) {
      console.error('Network error - check your connection');
      // Could show toast notification here
    } else if (error.status === 401) {
      console.error('Unauthorized - redirecting to login');
      // Could dispatch logout action and redirect to login
    } else if (error.status === 403) {
      console.error('Forbidden - access denied');
    } else if (error.status === 404) {
      console.error('Resource not found');
    } else if (error.status >= 500) {
      console.error('Server error - please try again later');
    }

    // Log to error tracking service (Sentry, etc.)
    // this.errorTrackingService.captureException(error);
  }
}
