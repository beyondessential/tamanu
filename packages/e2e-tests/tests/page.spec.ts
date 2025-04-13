import { test, expect } from '@playwright/test';
import { goToFacilityFrontend } from '../utils/navigation';

test('homepage has expected title', async ({ page }) => {
  await goToFacilityFrontend(page);
  await expect(page).toHaveTitle(/Tamanu/);
});
