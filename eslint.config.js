import babelParser from '@babel/eslint-parser';

export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      parser: babelParser,
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    settings: { react: { version: '16.13' } },
    rules: {},
  },
];
