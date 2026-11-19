import { test, expect } from '../../fixtures/baseFixture';

// Admin panel auth is included in the shared storageState via auth.setup.ts. The e2e provisioning
// creates Test Practitioner and facility-1, and leaves facility restriction off, so every user can
// log in to every facility.
// spec: USRPRF#facility-filter
test.describe('Admin panel user profiles', () => {
  test('Filters users by facility and shows their facility access', async ({
    userProfilesAdminPage,
  }) => {
    await userProfilesAdminPage.goto();
    await userProfilesAdminPage.searchUsers({
      displayName: 'Test Practitioner',
      facility: 'facility-1',
    });

    await expect(userProfilesAdminPage.userTableCell(0, 'displayName')).toHaveText(
      'Test Practitioner',
    );
    await expect(userProfilesAdminPage.userTableCell(0, 'allowedFacilities')).toHaveText(
      'All facilities',
    );
    await expect(userProfilesAdminPage.userTableCell(1, 'displayName')).toHaveCount(0);
  });
});
