import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    ignores: ['node_modules/**', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        document: 'readonly',
        window: 'readonly',
        console: 'readonly',
        URLSearchParams: 'readonly',
        Image: 'readonly',
        localStorage: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        requestAnimationFrame: 'readonly',
        getComputedStyle: 'readonly',
        HTMLElement: 'readonly',
        CanvasRenderingContext2D: 'readonly',
        Float32Array: 'readonly',
        Math: 'readonly',
        Promise: 'readonly',
        Error: 'readonly',
        setTimeout: 'readonly',
        HTMLImageElement: 'readonly',
        ColorThief: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      'no-dupe-keys': 'error',
      'no-redeclare': 'error',
      'no-var': 'off',
    },
  },
];
