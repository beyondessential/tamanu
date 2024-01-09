import { element, by } from 'detox';

export const signIn = async (email, password) => {
  await element(by.id('intro-sign-in-button')).tap();
  // select email and password
  const emailInput = await element(by.id('Email'));
  const passwordInput = await element(by.id('Password'));
  await emailInput.typeText(email);
  await passwordInput.tap();
  await passwordInput.typeText(password);

  const loginBtn = await element(by.id('Sign in'));
  await loginBtn.tap();
};

export const signOut = async () => {
  await element(by.id('MORE')).tap();
  await element(by.id('Sign out')).tap();
};
