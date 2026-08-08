module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm start -- --host 127.0.0.1 --port 4200',
      startServerReadyPattern: 'Local:',
      url: ['http://127.0.0.1:4200/'],
      numberOfRuns: 2,
      settings: {
        chromeFlags: '--no-sandbox --headless=new',
        onlyCategories: ['performance'],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.65 }],
        'first-contentful-paint': ['error', { maxNumericValue: 3000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 600 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './reports/lighthouse',
    },
  },
};
