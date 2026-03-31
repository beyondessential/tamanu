import { Locator, Page } from '@playwright/test';

/**
 * Wait for a dialog/modal to become visible and stable.
 *
 * @param anchor - A locator expected to be visible when the modal is open (e.g. a confirm button).
 * @param page   - Playwright page, used to await `networkidle`.
 */
export async function waitForModalOpen(anchor: Locator, page: Page): Promise<void> {
  await anchor.waitFor({ state: 'visible' });
  await page.waitForLoadState('networkidle', { timeout: 10000 });
}

/**
 * Wait for a dialog/modal to close (the anchor element is removed from the DOM).
 *
 * @param anchor - The same locator used in `waitForModalOpen`.
 */
export async function waitForModalClose(anchor: Locator): Promise<void> {
  await anchor.waitFor({ state: 'detached' });
}
