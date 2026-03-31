import { Page } from '@playwright/test';

/**
 * Assign `page.getByTestId(id)` to `target[key]` for every entry in the `testIds` map.
 *
 * Call this once with all "plain" testid mappings, then override individual locators
 * in the constructor for special cases (nested selectors, role queries, scoped locators, etc.).
 *
 * @example
 * ```ts
 * constructor(page: Page) {
 *   this.page = page;
 *   assignTestIdLocators(this, page, {
 *     confirmButton: 'formsubmitcancelrow-confirmButton',
 *     cancelButton: 'outlinedbutton-8rnr',
 *   });
 *   // Override for a locator that needs extra scoping:
 *   this.cancelButton = page.getByRole('dialog').getByTestId('outlinedbutton-8rnr');
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function assignTestIdLocators(
  target: any,
  page: Page,
  testIds: Record<string, string>,
): void {
  for (const [key, id] of Object.entries(testIds)) {
    target[key] = page.getByTestId(id);
  }
}
