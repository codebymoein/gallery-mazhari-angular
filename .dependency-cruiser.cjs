module.exports = {
  forbidden: [
    {
      name: 'frontend-must-not-import-backend',
      severity: 'error',
      from: { path: '^src/' },
      to: { path: '^backend/' }
    },
    {
      name: 'backend-must-not-import-frontend',
      severity: 'error',
      from: { path: '^backend/src/' },
      to: { path: '^src/' }
    },
    {
      name: 'no-angular-wordpress-api-layer',
      comment: 'Direct WordPress/WooCommerce business API access from Angular is legacy. Use NestJS/PostgreSQL contracts or an explicit backend adapter.',
      severity: 'error',
      from: { path: '^src/' },
      to: { path: '^src/app/core/api/wordpress\\.service\\.ts$' }
    }
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default']
    }
  }
};
