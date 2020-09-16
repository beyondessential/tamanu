/* eslint-disable @typescript-eslint/no-var-requires*/
const { device, expect, element, by, waitFor } = require('detox');
const { signIn, signOut } = require('./helpers/auth');
const {
  invalidUserCredentialsMessage,
} = require('../App/ui/contexts/authContext/auth-error');

const validCredentials = {
  email: 'a@a.com',
  password: '123456',
};

describe('Sign in cases', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });
  afterAll(async () => {
    await device.clearKeychain();
  });

  it('Should not sign in with wrong password ', async () => {
    await signIn(validCredentials.email, '12345');
    await expect(element(by.text('Skip'))).toBeNotVisible();
    await expect(element(by.text(invalidUserCredentialsMessage))).toBeVisible();
  });

  it('Should not sign in with wrong email ', async () => {
    await signIn('a@b.com', validCredentials.password);
    await expect(element(by.text('Skip'))).toBeNotVisible();
    await expect(element(by.text(invalidUserCredentialsMessage))).toBeVisible();
  });

  it('Should sign for first time in with valid credentials', async () => {
    await signIn(validCredentials.email, validCredentials.password);
    await waitFor(element(by.id('signin-skip-button-1')));
    const skipButton = await element(by.id('signin-skip-button-1'));
    await expect(skipButton).toBeVisible();
    await skipButton.tap();
    await element(by.id('signin-skip-button-2')).tap();
    await element(by.id('signin-skip-button-3')).tap();
    await waitFor(element(by.id('search-patients-button')));
    await expect(element(by.id('search-patients-button'))).toBeVisible();
  });

  it('Should Sign out', async () => {
    await signOut();
  });

  it('should sign in and go straight to patient home', async () => {
    await signIn(validCredentials.email, validCredentials.password);
    await waitFor(element(by.id('search-patients-button')));
    await expect(element(by.id('search-patients-button'))).toBeVisible();
  });
});
