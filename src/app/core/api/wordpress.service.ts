import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

/**
 * WordPress REST API Service
 * Handles all API communication with WordPress backend
 * Supports: Products, Categories, Curated Looks, Dream Canvas, Consultation
 */
@Injectable({
  providedIn: 'root'
})
export class WordPressService {
  private apiUrl: string;
  private readonly WC_API = '/wc/v3';
  private readonly MAZHARI_API = '/mazhari/v1';

  constructor(private http: HttpClient) {
    this.apiUrl = `${environment.apiBaseUrl}${environment.apiPath}`;
  }

  /**
   * ==================== PRODUCTS ====================
   */

  /**
   * Get all products with optional filters
   * @param params - Query parameters (page, per_page, category, etc.)
   * @returns Observable<any> - Products array
   */
  getProducts(params?: any): Observable<any> {
    const httpParams = this.buildHttpParams(params);
    return this.http.get<any>(
      `${this.apiUrl}${this.WC_API}/products`,
      { params: httpParams }
    );
  }

  /**
   * Get single product by ID
   * @param id - Product ID
   * @returns Observable<any> - Product object
   */
  getProduct(id: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}${this.WC_API}/products/${id}`
    );
  }

  /**
   * Search products by name
   * @param query - Search query
   * @param limit - Results limit
   * @returns Observable<any> - Matching products
   */
  searchProducts(query: string, limit: number = 20): Observable<any> {
    const params = new HttpParams()
      .set('search', query)
      .set('per_page', limit.toString());

    return this.http.get<any>(
      `${this.apiUrl}${this.WC_API}/products`,
      { params }
    );
  }

  /**
   * ==================== CATEGORIES ====================
   */

  /**
   * Get all product categories
   * @param params - Query parameters
   * @returns Observable<any> - Categories array
   */
  getCategories(params?: any): Observable<any> {
    const httpParams = this.buildHttpParams(params);
    return this.http.get<any>(
      `${this.apiUrl}${this.WC_API}/product_categories`,
      { params: httpParams }
    );
  }

  /**
   * Get single category by ID
   * @param id - Category ID
   * @returns Observable<any> - Category object
   */
  getCategory(id: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}${this.WC_API}/product_categories/${id}`
    );
  }

  /**
   * ==================== PRODUCT ATTRIBUTES ====================
   */

  /**
   * Get all product attributes (Color, Material, Size, etc.)
   * @returns Observable<any> - Attributes array
   */
  getAttributes(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}${this.WC_API}/products/attributes`
    );
  }

  /**
   * Get attribute terms (e.g., colors for color attribute)
   * @param attributeId - Attribute ID
   * @returns Observable<any> - Attribute terms
   */
  getAttributeTerms(attributeId: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}${this.WC_API}/products/attributes/${attributeId}/terms`
    );
  }

  /**
   * ==================== CURATED LOOKS ====================
   */

  /**
   * Get all curated looks
   * @param params - Query parameters
   * @returns Observable<any> - Curated looks array
   */
  getCuratedLooks(params?: any): Observable<any> {
    const httpParams = this.buildHttpParams(params);
    return this.http.get<any>(
      `${this.apiUrl}${this.MAZHARI_API}/curated-looks`,
      { params: httpParams }
    );
  }

  /**
   * Get single curated look
   * @param id - Look ID
   * @returns Observable<any> - Curated look object
   */
  getCuratedLook(id: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}${this.MAZHARI_API}/curated-looks/${id}`
    );
  }

  /**
   * Get featured curated looks (homepage display)
   * @returns Observable<any> - Featured looks array
   */
  getFeaturedLooks(): Observable<any> {
    const params = new HttpParams()
      .set('featured', 'true')
      .set('per_page', '6');

    return this.http.get<any>(
      `${this.apiUrl}${this.MAZHARI_API}/curated-looks`,
      { params }
    );
  }

  /**
   * ==================== DREAM CANVAS ====================
   */

  /**
   * Get user's dream canvas
   * @param userId - User ID or 'guest'
   * @returns Observable<any> - Dream canvas object
   */
  getDreamCanvas(userId: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}${this.MAZHARI_API}/dream-canvas/${userId}`
    );
  }

  /**
   * Save or update dream canvas
   * @param userId - User ID or 'guest'
   * @param data - Dream canvas data
   * @returns Observable<any> - Updated canvas
   */
  saveDreamCanvas(userId: string, data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}${this.MAZHARI_API}/dream-canvas/${userId}`,
      data
    );
  }

  /**
   * Add product to dream canvas
   * @param userId - User ID
   * @param productId - Product ID to add
   * @param notes - Optional notes
   * @returns Observable<any> - Updated canvas
   */
  addToDreamCanvas(userId: string, productId: number, notes?: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}${this.MAZHARI_API}/dream-canvas/${userId}/add`,
      { product_id: productId, notes }
    );
  }

  /**
   * Remove product from dream canvas
   * @param userId - User ID
   * @param productId - Product ID to remove
   * @returns Observable<any> - Updated canvas
   */
  removeFromDreamCanvas(userId: string, productId: number): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}${this.MAZHARI_API}/dream-canvas/${userId}/remove/${productId}`
    );
  }

  /**
   * Share dream canvas
   * @param userId - User ID
   * @returns Observable<string> - Share URL
   */
  shareDreamCanvas(userId: string): Observable<string> {
    return this.http.post<string>(
      `${this.apiUrl}${this.MAZHARI_API}/dream-canvas/${userId}/share`,
      {}
    );
  }

  /**
   * ==================== CONSULTATION ====================
   */

  /**
   * Submit consultation request
   * @param data - Consultation form data
   * @returns Observable<any> - Response
   */
  submitConsultation(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}${this.MAZHARI_API}/consultation-request`,
      data
    );
  }

  /**
   * Get available consultation times
   * @returns Observable<any> - Available time slots
   */
  getAvailableConsultationTimes(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}${this.MAZHARI_API}/consultation-times`
    );
  }

  /**
   * ==================== ORDERS ====================
   */

  /**
   * Create order
   * @param data - Order data
   * @returns Observable<any> - Created order
   */
  createOrder(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}${this.WC_API}/orders`,
      data
    );
  }

  /**
   * Get user orders
   * @param userId - Customer ID
   * @param params - Query parameters
   * @returns Observable<any> - Orders array
   */
  getUserOrders(userId: number, params?: any): Observable<any> {
    let httpParams = new HttpParams()
      .set('customer', userId.toString());

    if (params) {
      this.buildParamsArray(params).forEach(([key, value]) => {
        httpParams = httpParams.set(key, value);
      });
    }

    return this.http.get<any>(
      `${this.apiUrl}${this.WC_API}/orders`,
      { params: httpParams }
    );
  }

  /**
   * Get single order
   * @param orderId - Order ID
   * @returns Observable<any> - Order object
   */
  getOrder(orderId: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}${this.WC_API}/orders/${orderId}`
    );
  }

  /**
   * ==================== CUSTOMERS ====================
   */

  /**
   * Get current user info (requires authentication)
   * @returns Observable<any> - User object
   */
  getCurrentUser(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/wp/v2/users/me`
    );
  }

  /**
   * Register new customer
   * @param data - Registration data
   * @returns Observable<any> - User object
   */
  registerCustomer(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}${this.WC_API}/customers`,
      data
    );
  }

  /**
   * ==================== ENGRAVING ====================
   */

  /**
   * Get engraving options for product
   * @param productId - Product ID
   * @returns Observable<any> - Engraving options
   */
  getEngravingOptions(productId: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}${this.MAZHARI_API}/engraving/${productId}`
    );
  }

  /**
   * Submit engraving request
   * @param orderId - Order ID
   * @param data - Engraving data
   * @returns Observable<any> - Response
   */
  submitEngraving(orderId: number, data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}${this.MAZHARI_API}/engraving/${orderId}`,
      data
    );
  }

  /**
   * ==================== HELPER METHODS ====================
   */

  /**
   * Build HttpParams from object
   * @param params - Parameters object
   * @returns HttpParams - Built parameters
   */
  private buildHttpParams(params?: any): HttpParams {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    return httpParams;
  }

  /**
   * Build HttpParams array from object
   * @param params - Parameters object
   * @returns Array of [key, value] pairs
   */
  private buildParamsArray(params?: any): Array<[string, string]> {
    const result: Array<[string, string]> = [];

    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          result.push([key, params[key].toString()]);
        }
      });
    }

    return result;
  }

  /**
   * Check if API is reachable
   * @returns Observable<boolean> - API availability
   */
  checkApiHealth(): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.apiUrl}/wp/v2/block-types`
    ).pipe(
      // Handle success
    );
  }
}
