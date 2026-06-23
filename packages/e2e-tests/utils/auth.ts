import { Page } from '@playwright/test';

import { LoginPage } from '../pages/LoginPage';
import { getItemFromLocalStorage } from './localStorage';
import { AUTH_STATE_PATH } from '../config/auth';

const TOKEN_EXPIRY_BUFFER_SECONDS = 60;

function isTokenExpired(token: string, bufferSeconds = TOKEN_EXPIRY_BUFFER_SECONDS): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    const exp = payload.exp as number | undefined;
    if (!exp) return true;
    return Date.now() / 1000 >= exp - bufferSeconds;
  } catch {
    return true;
  }
}

/**
 * Ensures the page has a valid auth token. If the token is missing or expired,
 * performs login and persists the new storage state so subsequent tests get fresh auth.
 * Call this before creating API contexts or using token from localStorage in long-running e2e runs (e.g. CI).
 */
export async function ensureValidToken(page: Page): Promise<void> {
  let token: string | null = null;
  try {
    token = await getItemFromLocalStorage(page, 'apiToken');
  } catch {
    // No token in storage
  }

  if (token && !isTokenExpired(token)) {
    return;
  }

  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;
  if (!email || !password) {
    throw new Error('TEST_EMAIL and TEST_PASSWORD environment variables must be set to re-authenticate');
  }

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(email, password);
  await page.waitForTimeout(1000);

  await page.context().storageState({ path: AUTH_STATE_PATH });
}
