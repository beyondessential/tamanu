import { Locator, Page, expect } from '@playwright/test';

export const selectRandomSelectFieldOption = async (page: Page, field: Locator) => {
  await expect(field).toBeEnabled();
  await field.click();

  const rawTestId = await field.getAttribute('data-testid');
  const testId = rawTestId?.replace('-select', '');

  const optionLocator = page.getByTestId(`${testId}-option`);
  await optionLocator.first().waitFor({ state: 'visible' });

  const options = await optionLocator.all();
  if (options.length === 0) throw new Error(`No options found for ${testId}`);

  const selectedOption = options[Math.floor(Math.random() * options.length)];
  const selectedOptionText = await selectedOption.innerText();

  await selectedOption.click();

  const visibleValue = field.locator(`text="${selectedOptionText}"`).first();
  await expect(visibleValue).toBeVisible({ timeout: 1000 });
};

export const selectRandomAutocompleteFieldOption = async (
  page: Page,
  field: Locator,
  { stripTag = true }: { stripTag?: boolean } = {},
) => {
  await expect(field).toBeEnabled();
  await field.click();

  const input = field.locator('input');

  const rawTestId = await field.getAttribute('data-testid');
  const testId = stripTag ? rawTestId?.replace('-input', '') : rawTestId;

  const suggestionsContainer = page.getByTestId(`${testId}-suggestionslist`);
  await suggestionsContainer.waitFor({ state: 'attached', timeout: 5000 });
  const optionLocator = suggestionsContainer.getByTestId(`${testId}-option-typography`);
  await optionLocator.first().waitFor({ state: 'attached', timeout: 5000 });

  const options = await optionLocator.all();
  if (options.length === 0) throw new Error(`No options found for ${testId}`);

  // Select a random option
  const randomIndex = Math.floor(Math.random() * options.length);
  const selectedOption = options[randomIndex];
  const selectedOptionText = await selectedOption.innerText();

  await selectedOption.click();

  await expect(suggestionsContainer).not.toBeVisible({ timeout: 1000 });
  await expect(input).toHaveValue(selectedOptionText, { timeout: 5000 });
};
