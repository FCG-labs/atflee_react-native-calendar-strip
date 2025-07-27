export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      parser: 'babel-eslint',
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    settings: { react: { version: '16.13' } },
    rules: {},
  },
];
