/**
 * Production Environment Configuration
 */

export const environment = {
  production: true,
  version: '1.0.0',

  // API Configuration
  apiBaseUrl: 'https://gallery-mazhari.ir',
  apiPath: '/wp-json',
  backendApiBaseUrl: 'https://api.gallery-mazhari.ir/api',
  /** Product photos and large files are deployed independently from app code. */
  mediaBaseUrl: 'https://media.gallery-mazhari.ir',
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
    api: false,
    storage: false,
    state: false,
    errors: false
  },

  // Cache Settings
  cache: {
    enabled: true,
    ttl: 86400, // 24 hours in seconds
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
    excelInventorySnapshot: 'mazhariExcelInventorySnapshotV1',
    publishedProducts: 'mazhariPublishedProductsV1'
  },

  notifications: {
    telegramBotToken: '',
    telegramChatId: '',
    smsGatewayUrl: '',
    smsAdminNumber: '09352181200'
  }
};
