import { test , expect } from '@playwright/test';
import { test as fixtureTest } from './fixtures';
import { LoginPage } from '../pages/loginPage';
import testData from '../utils/testData.json' assert { type: 'json' };

    let loginPage: LoginPage;

    fixtureTest('User should be able to log in with valid credentials', async ({ loggedInPage }) => {
        loginPage = new LoginPage(loggedInPage);
        expect(await loginPage.isLoggedIn()).toBeTruthy();
    });

    test('Should show error message with invalid credentials', async ({ page }) => {
        loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(
            testData.facilityLogin.invalidUser.username,
            testData.facilityLogin.invalidUser.password
        );
        const emailErrorMessage = await loginPage.emailErrorMessage.textContent();
        const passwordErrorMessage = await loginPage.passwordErrorMessage.textContent();
        expect(emailErrorMessage).toMatch(/incorrect credentials/i);
        expect(passwordErrorMessage).toMatch(/incorrect credentials/i);
    });

