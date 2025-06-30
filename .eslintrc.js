module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      ecmaFeatures: { jsx: true },
      project: './tsconfig.json',     // optional but useful for stricter rules
    },
    plugins: ['@typescript-eslint', 'react'],
    extends: [
      'eslint:recommended',
      'plugin:react/recommended',
      'plugin:@typescript-eslint/recommended',
    ],
    settings: { react: { version: 'detect' } },
    overrides: [
      {
        files: ['*.ts', '*.tsx'],
        rules: {
          // put any TS-specific overrides here
        },
      },
    ],
  };