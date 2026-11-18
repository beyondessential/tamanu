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
    // A value spliced into a LIKE pattern has its own `%` and `_` read as wildcards, so a search
    // for `_` matches every row. Build patterns with likePattern from @tamanu/utils, which matches
    // interpolated values literally. Flags an untagged template with a `%` in the unbroken run of
    // text either side of an interpolation, as in `%${value}%` or `${key}.%`. Test files take
    // the next block's rule set instead.
    files: [`packages/{central-server,facility-server,database,shared,mobile}/**/*.${EXTS}`],
    ignores: [
      '**/migrations/**',
      // Code-owned by the sync and integrations teams, who bring it onto likePattern themselves
      'packages/*/{app,src}/sync/**',
      'packages/mobile/App/services/sync/**',
      'packages/central-server/app/hl7fhir/**',
      'packages/database/src/{models,utils}/fhir/**',
      'packages/shared/src/{routes,tasks,utils}/fhir/**',
      'packages/shared/src/services/fhirTypes/**',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'TemplateLiteral[expressions.length>0]:not(TaggedTemplateExpression > TemplateLiteral) > TemplateElement:matches([tail=false][value.raw=/%\\S*$/], [value.raw=/^\\S*%/])',
          message:
            'Build LIKE patterns with the likePattern tagged template from @tamanu/utils so interpolated values are matched literally. For a displayed percentage, disable this rule on the line.',
        },
        {
          selector: "MemberExpression[object.name='Op'][property.name=/^(substring|startsWith|endsWith)$/]",
          message:
            'Sequelize does not escape wildcards for this operator. Use Op.like or Op.iLike with likePattern from @tamanu/utils.',
        },
      ],
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
