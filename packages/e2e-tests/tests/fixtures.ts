import { test as base, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/loginPage';
import testData from '../utils/testData.json' assert { type: 'json' };

// Define the fixtures
type Fixtures = {
    loggedInPage: Page;
};

// Extend the base test with login functionality
export const test = base.extend<Fixtures>({
    loggedInPage: async ({ page }, use) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(
            testData.facilityLogin.validUser.username,
            testData.facilityLogin.validUser.password
        );
        await expect(await loginPage.isLoggedIn()).toBeTruthy();
        await use(page);
    }
});

// Export expect for use in tests
export { expect }; 