import { Locator, Page, expect } from '@playwright/test';

async function getBaseTestId(field: Locator, suffixToRemove: string): Promise<string> {
  const rawTestId = await field.getAttribute('data-testid');
  if (!rawTestId) {
    throw new Error(`Field is missing a data-testid attribute`);
  }
  return rawTestId.replace(suffixToRemove, '');
}

export const selectOptionFromPopper = async (
  baseTestId: string,
  popper: Locator,
  {
    selectFirst = false,
    optionToSelect = null,
  }: { selectFirst?: boolean; optionToSelect?: string | null } = {},
): Promise<string> => {
  await popper.waitFor({ state: 'attached', timeout: 5000 });

  const optionLocator = popper.getByTestId(`${baseTestId}-option`);
  await optionLocator.first().waitFor({ state: 'attached', timeout: 5000 });

  const options = await optionLocator.all();
  if (options.length === 0) {
    throw new Error(`No options found for ${baseTestId}`);
  }

  let selectedOption: Locator | undefined;

  if (optionToSelect) {
    selectedOption = options.find(async (option) => (await option.innerText()) === optionToSelect);

    if (!selectedOption) {
      throw new Error(`Option "${optionToSelect}" not found in popper`);
    }
  } else {
    selectedOption = selectFirst ? options[0] : options[Math.floor(Math.random() * options.length)];
  }

  const selectedOptionText = await selectedOption.innerText();
  await selectedOption.click();

  await expect(popper).not.toBeVisible({ timeout: 1000 });

  return selectedOptionText;
};

/**
 * Selects a random or specified option from a SelectField.
 * @param page - The page object.
 * @param field - The field locator.
 * @param selectFirst - Whether to select the first option.
 * @param optionToSelect - The optional option to select.
 * @param stripTag - Whether to strip the tag from the test id (e.g. a trailing -select) to get the base test id.
 */
export const selectFieldOption = async (
  page: Page,
  field: Locator,
  {
    selectFirst = false,
    optionToSelect = null,
    stripTag = true,
  }: { selectFirst?: boolean; optionToSelect?: string | null; stripTag?: boolean } = {},
) => {
  await expect(field).toBeEnabled();
  await field.click();

  const testId = await getBaseTestId(field, stripTag ? '-select' : '');
  const popper = page.getByTestId(`${testId}-optioncontainer`);
  const selectedOptionText = await selectOptionFromPopper(testId, popper, {
    selectFirst,
    optionToSelect,
  });

  await expect(field.locator(`text="${selectedOptionText}"`).first()).toBeVisible({
    timeout: 1000,
  });
};

/**
 * Selects a random or specified option from an AutocompleteField.
 * @param page - The page object.
 * @param field - The field locator.
 * @param selectFirst - Whether to select the first option.
 * @param optionToSelect - The optional option to select.
 * @param stripTag - Whether to strip the tag from the test id (e.g. a trailing -input) to get the base test id.
 */
export const selectAutocompleteFieldOption = async (
  page: Page,
  field: Locator,
  {
    selectFirst = false,
    optionToSelect = null,
    stripTag = true,
  }: {
    selectFirst?: boolean;
    optionToSelect?: string | null;
    stripTag?: boolean;
  } = {},
) => {
  await expect(field).toBeEnabled();
  await field.click();

  const input = field.locator('input');
  const testId = await getBaseTestId(field, stripTag ? '-input' : '');
  const suggestionsContainer = page.getByTestId(`${testId}-suggestionslist`);
  const selectedOptionText = await selectOptionFromPopper(testId, suggestionsContainer, {
    selectFirst,
    optionToSelect,
  });

  await expect(input).toHaveValue(selectedOptionText, { timeout: 1000 });
};
