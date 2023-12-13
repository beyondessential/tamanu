import js from '@eslint/js';
import markdown from 'eslint-plugin-markdown';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    files: ['packages/**/*.[cm]?[jt]sx?', 'scripts/**/*.[cm]?[jt]sx?'],
    env: {
      browser: true,
      node: true,
      es2022: true,
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-useless-rename': 'error',
      'no-duplicate-imports': 'error',
      'sort-imports': 'warn',
    },
  },
  {
    files: ['packages/*/__tests__/**/*.[cm]?[jt]sx?'],
    env: {
      jest: true,
    },
  },
  {
    files: ['**/*.md'],
    ignores: ['AddAliases.md'],
    plugins: {
      markdown,
    },
    processor: 'markdown/markdown',
    settings: {
      sharedData: 'Hello',
    },
  },
  {
    // https://eslint.org/docs/latest/use/configure/configuration-files-new#globally-ignoring-files-with-ignores
    ignores: [
      // catch-all for non-js processed files
      '**/*.md',

      // generated files
      'packages/*/dist',
      'packages/*/build',
      'packages/*/{src,app}/**/*.d.ts',

      // local config
      '**/config/local.*',
      '!**/config/local.example',
    ],
  },
];
