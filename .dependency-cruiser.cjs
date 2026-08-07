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
