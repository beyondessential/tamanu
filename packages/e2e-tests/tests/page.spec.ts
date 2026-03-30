import { test, expect } from '../fixtures/test';
import { goToFacility } from '@helpers/navigation';

test('homepage has expected title', async ({ page }) => {
  await goToFacility(page);
  await expect(page).toHaveTitle(/Tamanu/);
});
