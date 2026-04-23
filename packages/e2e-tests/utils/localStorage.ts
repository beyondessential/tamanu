import { Page } from '@playwright/test';
import { readPersistedAuthToken } from '@tamanu/api-client';

export const getItemFromLocalStorage = async (page: Page, key: string) => {
  const context = await page.context();
  const storageState = await context.storageState();
  const currentOrigin = new URL(page.url()).origin;
  const storageOrigin =
    storageState.origins.find(origin => origin.origin === currentOrigin) ?? storageState.origins[0];
  const response = storageOrigin?.localStorage.find(item => item.name === key)?.value;

  if (!response) {
    throw new Error(`No ${key} found in localStorage`);
  }

  return response;
};

export const getAuthTokenFromLocalStorage = async (page: Page) => {
  const context = await page.context();
  const storageState = await context.storageState();
  const currentOrigin = new URL(page.url()).origin;
  const storageOrigin =
    storageState.origins.find(origin => origin.origin === currentOrigin) ?? storageState.origins[0];

  if (!storageOrigin) {
    throw new Error('No localStorage origin found in browser storage state');
  }

  const storageMap = new Map(storageOrigin.localStorage.map(({ name, value }) => [name, value]));
  const storage = {
    getItem: (key: string) => storageMap.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storageMap.set(key, value);
    },
    removeItem: (key: string) => {
      storageMap.delete(key);
    },
  };

  const deviceId = storage.getItem('deviceId');
  if (!deviceId) {
    throw new Error('No deviceId found in localStorage');
  }

  const { token } = await readPersistedAuthToken(
    'apiToken',
    deviceId,
    'webapp',
    storage,
    storageOrigin.origin,
  );

  if (!token) {
    throw new Error('No API token found in localStorage');
  }

  return token;
};
