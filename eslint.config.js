import globals from 'globals';
import js from '@eslint/js';
import markdown from 'eslint-plugin-markdown';
import pluginQuery from '@tanstack/eslint-plugin-query';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import typescriptParser from '@typescript-eslint/parser';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';

const JS_EXTS = '{js,jsx,mjs,cjs,ts,mts,tsx}';
const TS_EXTS = '{ts,mts,tsx}';
const EXTS = `{${JS_EXTS},${TS_EXTS}}`;
const BROWSER_PACKAGES = '{web,ui-components,patient-portal}';

export default [
  {
    files: [
      `packages/**/*.${TS_EXTS}`,
      `scripts/**/*.${TS_EXTS}`,
      // repo-root configs, e.g. vitest.config.ts
      `**/*.config.${TS_EXTS}`,
    ],
    plugins: {
      '@typescript-eslint': typescriptPlugin,
    },
    languageOptions: {
      parser: typescriptParser,
    },
  },
  {
    files: [`packages/**/*.${JS_EXTS}`, `scripts/**/*.${JS_EXTS}`, `**/*.config.${JS_EXTS}`],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  {
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // import rules
      'no-useless-rename': 'error',
      'no-duplicate-imports': 'error',
      'sort-imports': 'off',

      // static analysis rules
      'no-constructor-return': 'error',
      'no-new-native-nonconstructor': 'error',
      'no-promise-executor-return': 'error',
      'no-self-compare': 'error',
      'no-template-curly-in-string': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unreachable-loop': 'error',
      'no-unused-private-class-members': 'error',
      'no-unused-vars': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react/jsx-key': 'error',
      'require-atomic-updates': 'error',

      // https://eslint.org/blog/2022/07/interesting-bugs-caught-by-no-constant-binary-expression/
      'no-constant-binary-expression': 'error',

      // overrides for react
      'react/prop-types': 'off',
      'react/display-name': 'off',
    },
  },
  // TanStack Query recommended rules, scoped to packages that use it
  ...pluginQuery.configs['flat/recommended'].map(config => ({
    ...config,
    files: [`packages/{mobile,web,patient-portal}/**/*.${EXTS}`],
  })),
  {
    // mobile rule exclusions (as warnings, until we fix them)
    files: [`packages/mobile/**/*.${TS_EXTS}`],
    rules: {
      'no-constructor-return': 'warn',
      'no-promise-executor-return': 'warn',
      'require-atomic-updates': 'warn',
      'react/jsx-key': 'warn',
    },
  },
  {
    files: [`**/*.${TS_EXTS}`],
    rules: {
      // Disable rules that are incompatible with or better handled by TypeScript
      ...typescriptPlugin.configs['eslint-recommended'].overrides[0].rules,
      'no-unused-vars': 'off',

      // support _unusedVar pattern
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // for ts multiple dispatch
      'no-dupe-class-members': 'off',
    },
  },
  {
    // mobile is the only package still on jest, and its suites use the globals. Everywhere
    // else runs vitest with explicit `import { ... } from 'vitest'`, so no test globals are
    // declared and a missing import is a no-undef error rather than a runtime failure.
    files: [
      `packages/mobile/**/__{mocks,tests}__/**/*.${EXTS}`,
      `packages/mobile/**/*.{spec,test}.${EXTS}`,
      `packages/mobile/jest*.${EXTS}`,
    ],
    languageOptions: {
      globals: globals.jest,
    },
  },
  {
    files: [
      `packages/*/__{mocks,tests}__/**/*.${EXTS}`,
      `packages/shared/src/test-helpers/**/*.${EXTS}`,
      `**/*.{spec,test}.${EXTS}`,
    ],
    rules: {
      // vitest hoists vi.mock above the file's imports, which it can only do for a call at
      // the top level of the module it's written in. Vitest 4 warns about a call nested in a
      // function, block, or describe/test callback; vitest 5 throws. Reach for vi.doMock when
      // a mock genuinely has to be registered part-way through a test.
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.object.name='vi'][callee.property.name='mock']:not(Program > ExpressionStatement > CallExpression)",
          message:
            'vi.mock must be called at the top level of the test file; use vi.doMock to register a mock mid-test.',
        },
      ],
    },
  },
  {
    // react-native globals
    files: [`packages/mobile/**/*.${TS_EXTS}`],
    languageOptions: {
      globals: {
        __DEV__: 'readonly',
        Element: 'readonly',
        FlatListProps: 'readonly',
        JSX: 'readonly',
        NodeJS: 'readonly',
        React: 'readonly',
        StyleProp: 'readonly',
        TextInputProps: 'readonly',
        TextStyle: 'readonly',
        ViewStyle: 'readonly',
      },
    },
  },
  {
    files: [`packages/${BROWSER_PACKAGES}/**/*.${EXTS}`, `packages/${BROWSER_PACKAGES}/*.${EXTS}`],
    languageOptions: {
      globals: {
        ...globals.browser,
        __VERSION__: 'readonly',
        __MIN_CHROME_VERSION__: 'readonly',
        module: 'readonly',

        // polyfilled by vite
        Buffer: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      // Path parameters must reach the API client as a `route()` template plus a
      // params object, not interpolated into the endpoint string — otherwise the
      // client only sees a concrete, flattened path and telemetry can't group by
      // route pattern. Forbid a template literal with `${...}` as the endpoint
      // argument of an api.<verb>() call.
      'no-restricted-syntax': [
        'error',
        // Kept from the base config — this block overrides `no-restricted-syntax`
        // for browser packages rather than extending it, so the base selector
        // must be repeated here.
        {
          selector:
            "CallExpression[callee.object.name='vi'][callee.property.name='mock']:not(Program > ExpressionStatement > CallExpression)",
          message:
            'vi.mock must be called at the top level of the test file; use vi.doMock to register a mock mid-test.',
        },
        {
          selector:
            "CallExpression[callee.object.name='api'][callee.property.name=/^(get|post|put|patch|delete|download)$/] > TemplateLiteral.arguments:first-child[expressions.length>0]",
          message:
            'Do not interpolate path params into the endpoint string. Use route() from @tamanu/api-client: api.get(route("patient/:patientId/allergies", { patientId }), query).',
        },
        // Interpolating into a route() template defeats the point of route(): the
        // template is the telemetry grouping key, so a value spliced into it makes a
        // different key per value. The one exception is a fixed base path spliced at
        // the start, as the admin call sites are written: route(`${ROLE_ENDPOINT}/:roleId`,
        // { roleId }) in views/administration/users/roles/useRoleQuery.js. That base is
        // one constant string, so it still groups as a single key. Anywhere after the
        // first literal character is where a real path param goes, so forbid it.
        {
          selector:
            "CallExpression[callee.name='route'] > TemplateLiteral[expressions.length>0][quasis.0.value.raw!='']",
          message:
            'Do not interpolate into a route() template except as a leading base-path constant. Pass the segment as a path param: route("admin/import/:endpoint", { endpoint }).',
        },
        // A leading interpolation only reads as a base path when it is a constant: a
        // SCREAMING_SNAKE module constant, or a field holding one (Suggester's
        // this.basePath). A local lowercase binding is a value like any other, so it
        // gets no exception even though it sits at the start.
        {
          selector:
            "CallExpression[callee.name='route'] > TemplateLiteral[expressions.length>0][quasis.0.value.raw=''][expressions.0.type!='MemberExpression'][expressions.0.name!=/^[A-Z][A-Z0-9_]*$/]",
          message:
            'A leading interpolation in a route() template is only allowed for a fixed base-path constant. Pass the segment as a path param: route("collection/:segment/updateStats", { segment }).',
        },
        // extendRoute takes the base path as its first argument, so a leading
        // interpolation in its template is not a base path and gets no exception.
        {
          selector:
            "CallExpression[callee.name='extendRoute'] > TemplateLiteral[expressions.length>0]",
          message:
            'Do not interpolate into an extendRoute() template. Pass the segment as a path param: extendRoute(endpoint, ":documentId", { documentId }).',
        },
        // The same, where the endpoint is held in a variable or passed down as a
        // prop before it reaches the api call, which the selector above can't see.
        {
          selector:
            'VariableDeclarator[id.name=/[eE]ndpoint$/] > TemplateLiteral.init[expressions.length>0]',
          message:
            'Do not interpolate path params into an endpoint string. Use route() from @tamanu/api-client: route("patient/:patientId/allergies", { patientId }).',
        },
        {
          selector:
            'JSXAttribute[name.name=/[eE]ndpoint$/] > JSXExpressionContainer > TemplateLiteral.expression[expressions.length>0]',
          message:
            'Do not interpolate path params into an endpoint prop. Use route() from @tamanu/api-client: route("patient/:patientId/allergies", { patientId }).',
        },
      ],
    },
  },
  {
    files: [
      `packages/!(${BROWSER_PACKAGES})/**/*.${JS_EXTS}`,
      `scripts/**/*.${JS_EXTS}`,
      `.github/**/*.${JS_EXTS}`,
      `**/*.config.${JS_EXTS}`,
    ],
    languageOptions: {
      globals: {
        ...globals.node,
        CryptoKeyPair: 'readonly',
      },
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
      '**/dist/**/*',
      '**/__disttests__/**/*',
      '**/build/**/*',
      '**/vendor/**/*',
      '**/*.d.ts',

      // templates
      '**/.migrationTemplate.ts',
      '**/serverMigrationTemplate.ts',

      // local config
      '**/config/local.*',
      '!**/config/local.example',
    ],
  },
];
