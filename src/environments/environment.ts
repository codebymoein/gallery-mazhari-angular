/**
 * Development Environment Configuration
 */

export const environment = {
  production: false,
  version: '1.0.0-dev',

  // API Configuration
  apiBaseUrl: 'http://localhost:8081',
  apiPath: '/wp-json',
  backendApiBaseUrl: 'http://localhost:3000/api',
  /** Empty in development: serve media from Angular's local /assets folder. */
  mediaBaseUrl: '',
  apiTimeout: 30000,

  // WordPress
  wpApiVersion: 'v3',
  wpRestNonce: '',

  // App Settings
  appName: 'Gallery Mazhari',
  appLanguage: 'fa',
  appCurrency: 'IRR',
  appTimeZone: 'Asia/Tehran',

  // Features
  features: {
    dreamCanvas: true,
    consultation: true,
    engraving: true,
    reviews: true,
    wishlist: true,
    comparison: true
  },

  // Debugging
  debug: {
    api: true,
    storage: true,
    state: true,
    errors: true
  },

  // Cache Settings
  cache: {
    enabled: true,
    ttl: 3600, // 1 hour in seconds
    clearOnLogout: true
  },

  // Storage Keys (aligned with WordPress theme)
  storageKeys: {
    cart: 'mazhari_cart',
    dreamCanvas: 'mazhariDreamCanvasGuestV1',
    weddingTimeline: 'mazhariWeddingTimelineV1',
    weddingTimelinePrompt: 'mazhariWeddingTimelinePromptV1',
    authToken: 'mazhari_auth_token',
    userPreferences: 'mazhari_user_prefs',
    theme: 'mazhari_theme',
    consultationRequests: 'mazhariConsultationRequestsV1',
    consultationRateLimit: 'mazhariConsultationRateLimitV1',
    adminSession: 'mazhari_admin_session',
    stagingQueue: 'mazhariStagingQueueV4',
    adminActivity: 'mazhariAdminActivityV1',
    excelInventorySnapshot: 'mazhariExcelInventorySnapshotV2',
    publishedProducts: 'mazhariPublishedProductsV1'
  },

  /** Telegram / SMS — leave empty in repo; configure per deployment. */
  notifications: {
    telegramBotToken: '',
    telegramChatId: '',
    smsGatewayUrl: '',
    smsAdminNumber: '09352181200'
  }
};
