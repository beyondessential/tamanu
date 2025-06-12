import { Page } from '@playwright/test';

export const getItemFromLocalStorage = async (page: Page, key: string) => {
  const context = await page.context();
  const storageState = await context.storageState();
  const response = storageState.origins[0].localStorage.find((item) => item.name === key)?.value;

  if (!response) {
    throw new Error(`No ${key} found in localStorage`);
  }

  return response;
};
