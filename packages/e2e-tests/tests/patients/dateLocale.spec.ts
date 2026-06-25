import { expect } from '@playwright/test';
import { format, parseISO } from 'date-fns';

import { test } from '../../fixtures/baseFixture';
import { STYLED_TABLE_CELL_PREFIX } from '@utils/testHelper';

/**
 * When no dateTimeLocale setting pins a deployment-wide convention, the app
 * formats dates with the browser's Intl locale. The rest of the suite runs
 * under the en-AU locale pinned in playwright.config.ts; these tests override
 * the browser locale per context to exercise that resolution end-to-end.
 * (The setting-override half of the chain is covered by unit tests.)
 */

const dateOfBirthOf = (patient: { dateOfBirth?: string | null }): Date => {
  if (!patient.dateOfBirth) throw new Error('fixture patient has no date of birth');
  return parseISO(patient.dateOfBirth);
};

test.describe('date display follows the browser locale', () => {
  test.describe('day-first browser locale (en-AU)', () => {
    test.use({ locale: 'en-AU' });

    test('renders table dates day-first', async ({ newPatient, allPatientsPage }) => {
      await allPatientsPage.goto();
      await allPatientsPage.searchTable({ NHN: newPatient.displayId, advancedSearch: false });
      await allPatientsPage.validateFirstRowContainsNHN(newPatient.displayId);

      const dateOfBirthCell = allPatientsPage.tableBody.getByTestId(
        `${STYLED_TABLE_CELL_PREFIX}0-dateOfBirth`,
      );
      await expect(dateOfBirthCell).toHaveText(format(dateOfBirthOf(newPatient), 'dd/MM/yyyy'));
    });
  });

  test.describe('month-first browser locale (en-US)', () => {
    test.use({ locale: 'en-US' });

    test('renders table dates month-first', async ({ newPatient, allPatientsPage }) => {
      await allPatientsPage.goto();
      await allPatientsPage.searchTable({ NHN: newPatient.displayId, advancedSearch: false });
      await allPatientsPage.validateFirstRowContainsNHN(newPatient.displayId);

      const dateOfBirthCell = allPatientsPage.tableBody.getByTestId(
        `${STYLED_TABLE_CELL_PREFIX}0-dateOfBirth`,
      );
      await expect(dateOfBirthCell).toHaveText(format(dateOfBirthOf(newPatient), 'MM/dd/yyyy'));
    });
  });
});
