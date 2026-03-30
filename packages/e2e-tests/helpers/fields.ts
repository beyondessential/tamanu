import { Locator, Page, expect } from '@playwright/test';

async function getBaseTestId(field: Locator, suffixToRemove: string): Promise<string> {
  const raw = await field.getAttribute('data-testid');
  if (!raw) throw new Error('Field is missing data-testid attribute');
  return raw.replace(suffixToRemove, '');
}

/**
 * Select an option from a Tamanu `SelectField`.
 * Pass `option` to select by exact text, or omit to select the first option.
 * Returns the text of the selected option.
 */
export async function selectOption(
  page: Page,
  field: Locator,
  option?: string,
): Promise<string> {
  await expect(field).toBeEnabled();
  await field.click();

  const baseId = await getBaseTestId(field, '-select');
  const popper = page.getByTestId(`${baseId}-optioncontainer`);
  const items = popper.getByTestId(`${baseId}-option`);

  await items.first().waitFor({ state: 'attached', timeout: 5000 });

  let target: Locator;
  if (option) {
    target = items.filter({ has: page.getByText(option, { exact: true }) }).first();
    await expect(target).toBeAttached({ timeout: 5000 });
  } else {
    target = items.first();
  }

  const text = (await target.innerText()).trim();
  await target.click({ force: true });
  await expect(popper).not.toBeVisible({ timeout: 1000 });
  return text;
}

/**
 * Select an option from a Tamanu `AutocompleteField`.
 * Pass `option` to select by exact text, or omit to select the first option.
 * Returns the text of the selected option.
 */
export async function selectAutocomplete(
  page: Page,
  field: Locator,
  option?: string,
): Promise<string> {
  await expect(field).toBeEnabled();
  await field.scrollIntoViewIfNeeded();

  const input = field.locator('input');
  if ((await input.count()) > 0) {
    await input.click();
  } else {
    await field.click();
  }

  const baseId = await getBaseTestId(field, '-input');
  const suggestions = page.getByTestId(`${baseId}-suggestionslist`);
  const items = suggestions.getByTestId(`${baseId}-option`);

  await items.first().waitFor({ state: 'attached', timeout: 5000 });

  let target: Locator;
  if (option) {
    target = items.filter({ has: page.getByText(option, { exact: true }) }).first();
    await expect(target).toBeAttached({ timeout: 5000 });
  } else {
    target = items.first();
  }

  const text = (await target.innerText()).trim();
  await target.click({ force: true });
  return text;
}

/**
 * Select the first option from a generic MUI listbox dropdown.
 * Use for fields that don't follow Tamanu's SelectField/AutocompleteField testid patterns.
 */
export async function selectFirstFromListbox(page: Page, input: Locator): Promise<string> {
  await input.click();
  const first = page.locator('[role="listbox"] li').first();
  await first.click();
  return (await first.textContent()) || '';
}

/**
 * Get all option texts from a Tamanu `SelectField` dropdown.
 */
export async function getAllOptions(page: Page, field: Locator): Promise<string[]> {
  await expect(field).toBeEnabled();
  await field.click();

  const baseId = await getBaseTestId(field, '-select');
  const popper = page.getByTestId(`${baseId}-optioncontainer`);
  const items = await popper.getByTestId(`${baseId}-option`).all();

  const texts: string[] = [];
  for (const item of items) {
    texts.push(await item.innerText());
  }

  await field.press('Escape');
  return texts;
}
