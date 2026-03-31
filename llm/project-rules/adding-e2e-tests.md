# Adding E2E Tests

Conventions and patterns for Playwright E2E tests in `packages/e2e-tests/`.

## Directory layout

```
packages/e2e-tests/
├── fixtures/          # Playwright fixtures
├── pages/             # Page-object classes (mirrors app page hierarchy)
├── tests/             # Spec files grouped by feature area
├── utils/             # Shared helpers (locators, fields, tables, dates, dialogs)
├── config/            # Routes, environment config
└── types/             # Shared TS types (e.g. Patient)
```

## Key helper utilities

| File | Purpose |
|---|---|
| `utils/locatorFactory.ts` | `assignTestIdLocators(target, page, map)` — bulk-assign `page.getByTestId` locators from a map |
| `utils/dialogHelpers.ts` | `waitForModalOpen` / `waitForModalClose` — reusable modal lifecycle helpers |
| `utils/tableHelper.ts` | `readStyledTableColumn`, `expectColumnSorted`, `expectDateColumnSorted`, `scrollTableToElement` |
| `utils/fieldHelpers.ts` | `selectAutocompleteFieldOption`, `selectFieldOption` |
| `utils/dateTimeHelpers.ts` | `fillMuiDateField`, `fillMuiDateTimeField`, `normalizeToIsoDateTimeMinute`, `parseTamanuDate` |
| `utils/testHelper.ts` | `STYLED_TABLE_CELL_PREFIX`, `TWO_COLUMNS_FIELD_TEST_ID`, `selectFromSearchBox`, `getTableItems` |
| `utils/apiHelpers.ts` | `createPatient`, `createApiContext`, encounter helpers, `getUser` |

## Writing a new page object

1. Create a class in `pages/` mirroring the app page hierarchy.
2. Use `assignTestIdLocators(this, page, { ... })` for all simple `data-testid` locators.
3. Override individual locators after the call for special cases (nested selectors, role queries, scoped locators).
4. Use the `!:` definite-assignment assertion on `readonly` Locator fields that are set by `assignTestIdLocators`.
5. For modal page objects, use `waitForModalOpen` / `waitForModalClose` from `dialogHelpers.ts`.

```ts
import { Page, Locator } from '@playwright/test';
import { assignTestIdLocators } from '@utils/locatorFactory';
import { waitForModalOpen, waitForModalClose } from '@utils/dialogHelpers';

export class MyModal {
  readonly page: Page;
  readonly confirmButton!: Locator;
  readonly nameInput!: Locator;

  constructor(page: Page) {
    this.page = page;
    assignTestIdLocators(this, page, {
      confirmButton: 'formsubmitcancelrow-confirmButton',
      nameInput: 'field-abc-input',
    });
    // Override if the locator needs extra scoping:
    this.nameInput = page.getByTestId('field-abc-input').locator('input');
  }

  async waitForModalToLoad() {
    await waitForModalOpen(this.confirmButton, this.page);
  }

  async waitForModalToClose() {
    await waitForModalClose(this.confirmButton);
  }
}
```

## Writing a new spec file

1. Import `test` and `expect` from `@fixtures/baseFixture`.
2. Prefer `camelCase` for function names (e.g. `selectFromSearchBox`).
3. Date/time fields use MUI pickers — always use `fillMuiDateField` / `fillMuiDateTimeField` instead of `.fill()`.
4. For table sort assertions, use `expectColumnSorted` / `expectDateColumnSorted` from `tableHelper.ts`.
5. Tag tests with ticket IDs in the test name: `test('[AT-0053] should create ...')`.

## Checklist for adding a new test

- Page objects exist for all pages/modals the test interacts with (or you created them)
- Locators use `data-testid` attributes where available; fall back to `getByRole`/`getByText` otherwise
- Date/time inputs use `fillMuiDateField` or `fillMuiDateTimeField`
- Table assertions use helpers from `tableHelper.ts`
- Modal wait logic uses `dialogHelpers.ts` (`waitForModalOpen`/`waitForModalClose`)
- No hard-coded sleeps (`page.waitForTimeout`) unless absolutely necessary; prefer `waitFor`, `.toPass()`, or `expect` polling
- Test is independent — does not rely on state from other tests
- Test tagged with its ticket ID in the name

## Naming conventions

- **Page objects**: PascalCase matching the UI section (e.g. `AllPatientsPage`, `LabRequestPane`)
- **Modals**: PascalCase with `Modal` suffix (e.g. `RecordSampleModal`)
- **Helper functions**: camelCase (e.g. `selectFromSearchBox`, `fillMuiDateField`)
- **Constants**: UPPER_SNAKE_CASE (e.g. `STYLED_TABLE_CELL_PREFIX`)
