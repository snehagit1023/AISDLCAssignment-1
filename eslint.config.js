const security = require('eslint-plugin-security');

module.exports = [
  {
    ignores: ['node_modules/', 'dist/', 'build/', 'coverage/', '*.min.js']
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        AbortSignal: 'readonly',
        AbortController: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        module: 'readonly',
        process: 'readonly',
        require: 'readonly',
        structuredClone: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        __dirname: 'readonly'
      }
    },
    plugins: {
      security
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      ...security.configs.recommended.rules
    }
  }
];
