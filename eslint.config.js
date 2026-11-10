const security = require('eslint-plugin-security');

module.exports = [
  {
    files: ['src/**/*.js', 'tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        Buffer: 'readonly',
        __dirname: 'readonly',
        console: 'readonly',
        module: 'readonly',
        process: 'readonly',
        require: 'readonly',
        setTimeout: 'readonly',
      },
    },
    plugins: {
      security,
    },
    rules: {
      ...security.configs.recommended.rules,
      'no-unused-vars': ['error', { args: 'none' }],
    },
  },
];
