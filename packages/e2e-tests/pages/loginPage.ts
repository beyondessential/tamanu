import { Locator, Page } from '@playwright/test';
import { BasePage } from './basePages/BasePage';

export class LoginPage extends BasePage {
    // Login page specific selectors
    readonly usernameInput: Locator;
    readonly passwordInput: Locator;
    readonly loginButton: Locator;
    readonly emailErrorMessage: Locator;    
    readonly passwordErrorMessage: Locator;

    constructor(page: Page) {
        super(page);
        this.usernameInput= page.locator('[name="email"]');
        this.passwordInput= page.locator('[name="password"]');
        this.loginButton= page.getByRole('button').getByText('Log in');
        this.emailErrorMessage= page.getByText('Incorrect credentials').nth(0);
        this.passwordErrorMessage= page.getByText('Incorrect credentials').nth(1);
    }

   

    async login(username: string, password: string) {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
        
    }

    async isLoggedIn(): Promise<boolean> {
        return (await this.page.waitForSelector('text=Dashboard')).isVisible();
    }
}
