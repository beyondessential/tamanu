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
    optionToAvoid = null,
  }: { selectFirst?: boolean; optionToSelect?: string | null; optionToAvoid?: string | null } = {},
): Promise<string> => {
  const waitMs = 5000;
  const optionLocator = popper.getByTestId(`${baseTestId}-option`);
  await optionLocator.first().waitFor({ state: 'attached', timeout: waitMs });

  const count = await optionLocator.count();
  if (count === 0) {
    throw new Error(`No options found for ${baseTestId}`);
  }

  let selectedOption: Locator;

  if (optionToSelect) {
    selectedOption = optionLocator
      .filter({ has: popper.page().getByText(optionToSelect, { exact: true }) })
      .first();
    await expect(selectedOption).toBeAttached({ timeout: waitMs });
  } else if (optionToAvoid) {
    const options = await optionLocator.all();
    const optionTexts = await Promise.all(
      options.map(async (opt) => {
        try {
          return (await opt.innerText({ timeout: 3000 })).trim();
        } catch {
          return '';
        }
      }),
    );
    const eligible = options.filter(
      (_, i) => optionTexts[i] !== '' && optionTexts[i] !== optionToAvoid,
    );
    if (eligible.length === 0) {
      throw new Error(`No options found that are not "${optionToAvoid}"`);
    }
    selectedOption = eligible[Math.floor(Math.random() * eligible.length)];
  } else {
    const index = selectFirst ? 0 : Math.floor(Math.random() * count);
    selectedOption = optionLocator.nth(index);
  }

  const selectedOptionText = (await selectedOption.innerText()).trim();
  await selectedOption.click({ force: true });

  await expect(popper).not.toBeVisible({ timeout: 2000 }).catch(() => undefined);

  return selectedOptionText;
};

/**
 * Selects a random or specified option from a SelectField.
 * @param page - The page object.
 * @param field - The field locator.
 * @param selectFirst - Whether to select the first option.
 * @param optionToSelect - The optional option to select.
 * @param optionToAvoid - The optional option to avoid. Will select a random option that is not optionToAvoid.
 * @param stripTag - Whether to strip the tag from the test id (e.g. a trailing -select) to get the base test id.
 * @param returnOptionText - Whether to return the text of the selected option.
 */
export const selectFieldOption = async (
  page: Page,
  field: Locator,
  {
    selectFirst = false,
    optionToSelect = null,
    optionToAvoid = null,
    stripTag = true,
    returnOptionText = false,
  }: {
    selectFirst?: boolean;
    optionToSelect?: string | null;
    optionToAvoid?: string | null;
    stripTag?: boolean;
    returnOptionText?: boolean;
  } = {},
) => {
  await expect(field).toBeEnabled();
  await field.click();

  const testId = await getBaseTestId(field, stripTag ? '-select' : '');
  const popper = page.getByTestId(`${testId}-optioncontainer`);
  const selectedOptionText = await selectOptionFromPopper(testId, popper, {
    selectFirst,
    optionToSelect,
    optionToAvoid,
  });

  await expect(field.locator(`text="${selectedOptionText}"`).first()).toBeVisible({
    timeout: 1000,
  });

  if (returnOptionText) {
    return selectedOptionText;
  }
};

/**
 * Selects a random or specified option from an AutocompleteField.
 * @param page - The page object.
 * @param field - The field locator.
 * @param selectFirst - Whether to select the first option.
 * @param optionToSelect - The optional option to select.
 * @param optionToAvoid - The optional option to avoid. Will select a random option that is not optionToAvoid.
 * @param stripTag - Whether to strip the tag from the test id (e.g. a trailing -input) to get the base test id.
 * @param returnOptionText - Whether to return the text of the selected option.
 */
export const selectAutocompleteFieldOption = async (
  page: Page,
  field: Locator,
  {
    selectFirst = false,
    optionToSelect = null,
    optionToAvoid = null,
    stripTag = true,
    returnOptionText = false,
  }: {
    selectFirst?: boolean;
    optionToSelect?: string | null;
    optionToAvoid?: string | null;
    stripTag?: boolean;
    returnOptionText?: boolean;
  } = {},
) => {
  await expect(field).toBeEnabled();
  await field.scrollIntoViewIfNeeded();
  const input = field.locator('input');
  if ((await input.count()) > 0) {
    await input.click();
  } else {
    await field.click();
  }

  const testId = await getBaseTestId(field, stripTag ? '-input' : '');

  const suggestionsContainer = page.getByTestId(`${testId}-suggestionslist`);
  const selectedOptionText = await selectOptionFromPopper(testId, suggestionsContainer, {
    selectFirst,
    optionToSelect,
    optionToAvoid,
  });

  if (returnOptionText) {
    return selectedOptionText;
  }
};

export const editFieldOption = async (
  page: Page,
  field: Locator,
  {
    fieldType = 'fieldOption',
    optionToAvoid = null,
    returnOptionText = false,
  }: {
    fieldType?: 'fieldOption' | 'autocompleteFieldOption';
    optionToAvoid?: string | null;
    returnOptionText?: boolean;
  } = {},
) => {
  const selectedOption = await (
    fieldType === 'fieldOption' ? selectFieldOption : selectAutocompleteFieldOption
  )(page, field, {
    optionToAvoid,
    returnOptionText,
  });

  if (returnOptionText) {
    return selectedOption;
  }
};

export const returnAllOptionsFromDropdown = async (
  page: Page,
  dropdown: Locator,
  {
    stripTag = true,
  }: {
    stripTag?: boolean;
  } = {},
) => {
  await expect(dropdown).toBeEnabled();
  await dropdown.click();

  const testId = await getBaseTestId(dropdown, stripTag ? '-select' : '');
  const popper = page.getByTestId(`${testId}-optioncontainer`);

  const optionLocator = popper.getByTestId(`${testId}-option`);
  const options = await optionLocator.all();
  const optionNames = [];
  for (const option of options) {
    optionNames.push(await option.innerText());
  }

  return optionNames;
};
