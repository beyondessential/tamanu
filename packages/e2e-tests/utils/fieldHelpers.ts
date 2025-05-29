import { Locator, Page, expect } from '@playwright/test';

export const selectRandomFieldOption = async (
  page: Page,
  field: Locator,
  {
    stripTag = true,
    isAutocomplete = false,
  }: { stripTag?: boolean; isAutocomplete?: boolean } = {},
) => {
  await expect(field).toBeEnabled();
  await field.click();

  const rawTestId = await field.getAttribute('data-testid');
  const testId = stripTag
    ? rawTestId?.replace('-input', '')?.replace('-select', '')
    : rawTestId?.replace('-select', '');

  const optionLocator = page.getByTestId(`${testId}-option`);
  await optionLocator.first().waitFor({ state: 'visible' });

  const options = await optionLocator.all();
  if (options.length === 0) throw new Error(`No options found for ${testId}`);

  const selectedOption = options[Math.floor(Math.random() * options.length)];
  await selectedOption.waitFor({ state: 'visible' });
  const selectedOptionText = await selectedOption.innerText();
  await selectedOption.scrollIntoViewIfNeeded();
  await selectedOption.hover();
  await selectedOption.click();

  if (isAutocomplete) {
    const input = field.locator('input');
    await input.press('Tab'); // confirms input in some components
    await input.evaluate((el) => (el as HTMLElement).blur()); // triggers validation
    await input.waitFor({ state: 'visible' });
    await expect(input).toHaveValue(selectedOptionText);
  } else {
    const visibleValue = page.locator(`text="${selectedOptionText}"`).first();
    await expect(visibleValue).toBeVisible();
  }
};
