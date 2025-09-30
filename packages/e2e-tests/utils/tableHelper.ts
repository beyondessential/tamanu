import { Locator } from '@playwright/test';

export async function scrollTableToElement(tableLocator: Locator, targetLocator: Locator) {
  let isVisible = await targetLocator.isVisible();

  while (!isVisible) {
    await tableLocator.evaluate(el => (el.scrollTop = el.scrollHeight));
    isVisible = await targetLocator.isVisible();
  }
}
