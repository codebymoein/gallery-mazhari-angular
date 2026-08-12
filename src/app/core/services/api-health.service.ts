/**
 * API Health Service
 * Tests and verifies API connectivity
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, timeout } from 'rxjs/operators';
import { environment } from '@env/environment';

export interface HealthCheckResult {
  success: boolean;
  message: string;
  apiUrl: string;
  responseTime: number;
  status: 'healthy' | 'unhealthy' | 'timeout';
  timestamp: string;
}

export interface ApiTestResult {
  success: boolean;
  status: number;
  message: string;
  responseTime: number;
}

export interface ApiTest {
  name: string;
  endpoint: string;
  method: 'GET' | 'POST';
  description: string;
  result?: ApiTestResult;
}

interface DataTestResult {
  success: boolean;
  count: number;
  data: unknown[];
  message: string;
}

interface DiagnosticsReport {
  timestamp: string;
  environment: 'production' | 'development';
  apiUrl: string;
  tests: {
    health: HealthCheckResult;
    endpoints: ApiTest[];
    products: DataTestResult;
    categories: DataTestResult;
  };
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ApiHealthService {
  private apiUrl = `${environment.apiBaseUrl}${environment.apiPath}`;

  constructor(private http: HttpClient) {}

  /**
   * Check API health
   */
  checkHealth(): Observable<HealthCheckResult> {
    const startTime = performance.now();

    return this.http.get<unknown>(`${this.apiUrl}/wp/v2/block-types`).pipe(
      timeout(environment.apiTimeout),
      map(() => {
        const responseTime = performance.now() - startTime;
        const result: HealthCheckResult = {
          success: true,
          message: 'API is reachable and healthy',
          apiUrl: this.apiUrl,
          responseTime,
          status: 'healthy',
          timestamp: new Date().toISOString()
        };
        return result;
      }),
      catchError((error) => {
        const responseTime = performance.now() - startTime;
        const result: HealthCheckResult = {
          success: false,
          message: error?.message || 'API is unreachable',
          apiUrl: this.apiUrl,
          responseTime,
          status: error?.name === 'TimeoutError' ? 'timeout' : 'unhealthy',
          timestamp: new Date().toISOString()
        };
        return of(result);
      })
    );
  }

  /**
   * Test WordPress REST API endpoints
   */
  testWpEndpoints(): Observable<ApiTest[]> {
    const tests: ApiTest[] = [
      {
        name: 'WP Block Types',
        endpoint: '/wp/v2/block-types',
        method: 'GET',
        description: 'WordPress core block types endpoint'
      },
      {
        name: 'WooCommerce Products',
        endpoint: '/wc/v3/products?per_page=1',
        method: 'GET',
        description: 'WooCommerce products list (1 product)'
      },
      {
        name: 'Product Categories',
        endpoint: '/wc/v3/product_categories?per_page=1',
        method: 'GET',
        description: 'WooCommerce product categories'
      },
      {
        name: 'Curated Looks',
        endpoint: '/mazhari/v1/curated-looks?per_page=1',
        method: 'GET',
        description: 'Custom Mazhari curated looks endpoint'
      }
    ];

    return new Observable(observer => {
      let completed = 0;

      tests.forEach((test, index) => {
        this.testEndpoint(test).subscribe((result) => {
          tests[index].result = result;
          completed++;

          if (completed === tests.length) {
            observer.next(tests);
            observer.complete();
          }
        });
      });
    });
  }

  /**
   * Test single endpoint
   */
  private testEndpoint(test: ApiTest): Observable<ApiTestResult> {
    const startTime = performance.now();
    const fullUrl = `${this.apiUrl}${test.endpoint}`;

    return this.http.get<unknown>(fullUrl).pipe(
      timeout(10000),
      map(() => {
        const responseTime = performance.now() - startTime;
        return {
          success: true,
          status: 200,
          message: 'Endpoint is reachable',
          responseTime
        };
      }),
      catchError((error) => {
        const responseTime = performance.now() - startTime;
        return of({
          success: false,
          status: error?.status || 0,
          message: error?.error?.message || error?.message || 'Endpoint unreachable',
          responseTime
        });
      })
    );
  }

  /**
   * Test product data retrieval
   */
  testProductData(): Observable<DataTestResult> {
    return this.http.get<unknown>(`${this.apiUrl}/wc/v3/products?per_page=3`).pipe(
      map((products) => ({
        success: true,
        count: Array.isArray(products) ? products.length : 0,
        data: Array.isArray(products) ? products : [products],
        message: 'Successfully retrieved products'
      })),
      catchError((error) => {
        return of({
          success: false,
          count: 0,
          data: [],
          message: error?.error?.message || 'Failed to retrieve products'
        });
      })
    );
  }

  /**
   * Test category data retrieval
   */
  testCategoryData(): Observable<DataTestResult> {
    return this.http.get<unknown>(`${this.apiUrl}/wc/v3/product_categories?per_page=5`).pipe(
      map((categories) => ({
        success: true,
        count: Array.isArray(categories) ? categories.length : 0,
        data: Array.isArray(categories) ? categories : [categories],
        message: 'Successfully retrieved categories'
      })),
      catchError((error) => {
        return of({
          success: false,
          count: 0,
          data: [],
          message: error?.error?.message || 'Failed to retrieve categories'
        });
      })
    );
  }

  /**
   * Comprehensive API test suite
   */
  runFullDiagnostics(): Observable<DiagnosticsReport> {
    return new Observable(observer => {
      const diagnostics: DiagnosticsReport = {
        timestamp: new Date().toISOString(),
        environment: environment.production ? 'production' : 'development',
        apiUrl: this.apiUrl,
        tests: {
          health: {
            success: false,
            message: '',
            apiUrl: this.apiUrl,
            responseTime: 0,
            status: 'unhealthy',
            timestamp: ''
          },
          endpoints: [],
          products: { success: false, count: 0, data: [], message: '' },
          categories: { success: false, count: 0, data: [], message: '' }
        },
        summary: {
          total: 0,
          passed: 0,
          failed: 0
        }
      };

      // Test 1: Health check
      this.checkHealth().subscribe(health => {
        diagnostics.tests.health = health;
        diagnostics.summary.total++;
        if (health.status === 'healthy') diagnostics.summary.passed++;
        else diagnostics.summary.failed++;

        // Test 2: Endpoints
        this.testWpEndpoints().subscribe(endpoints => {
          diagnostics.tests.endpoints = endpoints;
          endpoints.forEach(ep => {
            diagnostics.summary.total++;
            if (ep.result?.success) diagnostics.summary.passed++;
            else diagnostics.summary.failed++;
          });

          // Test 3: Product data
          this.testProductData().subscribe(products => {
            diagnostics.tests.products = products;
            diagnostics.summary.total++;
            if (products.success) diagnostics.summary.passed++;
            else diagnostics.summary.failed++;

            // Test 4: Category data
            this.testCategoryData().subscribe(categories => {
              diagnostics.tests.categories = categories;
              diagnostics.summary.total++;
              if (categories.success) diagnostics.summary.passed++;
              else diagnostics.summary.failed++;

              observer.next(diagnostics);
              observer.complete();
            });
          });
        });
      });
    });
  }

  /**
   * Log diagnostics to console
   */
  logDiagnostics(diagnostics: DiagnosticsReport): void {
    console.group('🏥 Gallery Mazhari - API Diagnostics');
    console.log('Timestamp:', diagnostics.timestamp);
    console.log('Environment:', diagnostics.environment);
    console.log('API URL:', diagnostics.apiUrl);
    console.log('');

    console.group('Health Status');
    const health = diagnostics.tests.health;
    console.log(`Status: ${health.status.toUpperCase()}`);
    console.log(`Response Time: ${health.responseTime.toFixed(2)}ms`);
    console.log(`Message: ${health.message}`);
    console.groupEnd();

    console.group('Endpoint Tests');
    diagnostics.tests.endpoints.forEach((ep: ApiTest) => {
      const icon = ep.result?.success ? '✅' : '❌';
      console.log(`${icon} ${ep.name} (${ep.result?.responseTime.toFixed(2)}ms)`);
    });
    console.groupEnd();

    console.group('Data Retrieval');
    console.log(`✅ Products: ${diagnostics.tests.products.count} items`);
    console.log(`✅ Categories: ${diagnostics.tests.categories.count} items`);
    console.groupEnd();

    console.group('Summary');
    console.log(`Total Tests: ${diagnostics.summary.total}`);
    console.log(`✅ Passed: ${diagnostics.summary.passed}`);
    console.log(`❌ Failed: ${diagnostics.summary.failed}`);
    console.log(`Success Rate: ${((diagnostics.summary.passed / diagnostics.summary.total) * 100).toFixed(1)}%`);
    console.groupEnd();

    console.groupEnd();
  }
}
