import { Locator, Page } from '@playwright/test';
import { selectAutocompleteFieldOption, selectFieldOption } from '@utils/fieldHelpers';

export class FormPage {
  readonly page: Page;
  readonly formGrid!: Locator;
  readonly nextButton!: Locator;
  readonly submitButton!: Locator;

  constructor(page: Page) {
    this.page = page;
    this.formGrid = this.page.getByTestId('formgrid-h378');
    this.nextButton = this.page.getByTestId('button-m3a6');
    // Submit button appears on the last screen instead of Next button
    this.submitButton = this.page.getByTestId('formsubmitbutton-pufy');
  }

  async waitForFormToLoad(): Promise<void> {
    // Wait for either next or submit button to appear (indicates form is loaded)
    try {
      await this.nextButton.waitFor({ state: 'visible',timeout: 10_000});
    } catch {
      await this.submitButton.waitFor({ state: 'visible'});
    }
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 });
  }

  /**
   * Gets the label/question text for a field by finding the label element
   */
  private async getFieldLabel(field: Locator): Promise<string> {
    try {
      // Try to find label in the field wrapper or nearby
      const fieldWrapper = field.locator('xpath=ancestor::*[contains(@class, "field") or contains(@data-testid, "field")][1]');
      const label = fieldWrapper.locator('label, [class*="label"], [data-testid*="label"], [class*="Label"]').first();
      if (await label.isVisible({ timeout: 500 }).catch(() => false)) {
        const labelText = await label.textContent();
        if (labelText && labelText.trim()) {
          return labelText.trim();
        }
      }
      // Try to find label by looking for text before the field
      const previousSibling = field.locator('xpath=preceding-sibling::*[1]');
      if (await previousSibling.isVisible({ timeout: 500 }).catch(() => false)) {
        const text = await previousSibling.textContent();
        if (text && text.trim()) {
          return text.trim();
        }
      }
      // For radio buttons, try to find the group label
      const radioGroup = field.locator('xpath=ancestor::*[contains(@class, "radio") or contains(@data-testid, "radio")][1]');
      const groupLabel = radioGroup.locator('xpath=preceding::*[contains(@class, "label") or contains(@data-testid, "label")][1]');
      if (await groupLabel.isVisible({ timeout: 500 }).catch(() => false)) {
        const text = await groupLabel.textContent();
        if (text && text.trim()) {
          return text.trim();
        }
      }
    } catch {
      // If we can't find a label, return empty string
    }
    return '';
  }

  /**
   * Fills all form fields on the current screen by selecting the first option
   * for dropdowns/selects/autocompletes and returns the selected values
   */
  async fillCurrentScreenWithFirstOptions(): Promise<Array<{ question: string; answer: string }>> {
    const selectedValues: Array<{ question: string; answer: string }> = [];

    // Fill select fields (dropdowns)
    const selectFields = this.page.locator('[data-testid$="-select"]');
    const selectCount = await selectFields.count();
    for (let i = 0; i < selectCount; i++) {
      const field = selectFields.nth(i);
      if (await field.isVisible({ timeout: 1000 }).catch(() => false)) {
        const question = await this.getFieldLabel(field);
        const answer = (await selectFieldOption(this.page, field, { selectFirst: true, returnOptionText: true }) as string) || '';
        if (answer) {
          selectedValues.push({ question, answer });
        }
        await this.page.waitForTimeout(300);
      }
    }

    // Fill autocomplete fields
    const autocompleteFields = this.page.locator('[data-testid*="autocompletefield"][data-testid$="-input"]');
    const autocompleteCount = await autocompleteFields.count();
    for (let i = 0; i < autocompleteCount; i++) {
      const field = autocompleteFields.nth(i);
      if (await field.isVisible({ timeout: 1000 }).catch(() => false)) {
        const question = await this.getFieldLabel(field);
        const answer = (await selectAutocompleteFieldOption(this.page, field, { selectFirst: true, returnOptionText: true }) as string) || '';
        if (answer) {
          selectedValues.push({ question, answer });
        }
        await this.page.waitForTimeout(300);
      }
    }

    // Fill radio button groups (select first radio in each group)
    const radioButtons = this.page.locator('[data-testid^="radio-"]');
    const radioCount = await radioButtons.count();
    const processedGroups = new Set<string>();
    
    for (let i = 0; i < radioCount; i++) {
      const radio = radioButtons.nth(i);
      const testId = await radio.getAttribute('data-testid').catch(() => null);
      if (testId) {
        const groupId = testId.substring(0, testId.lastIndexOf('-'));
        if (!processedGroups.has(groupId) && await radio.isVisible({ timeout: 1000 }).catch(() => false)) {
          // Get question label before clicking
          const question = await this.getFieldLabel(radio);
          // Get the radio button label text (the option text)
          const radioLabel = radio.locator('xpath=following-sibling::label[1] | xpath=preceding-sibling::label[1] | xpath=ancestor::label[1]');
          let answer = '';
          if (await radioLabel.isVisible({ timeout: 500 }).catch(() => false)) {
            answer = (await radioLabel.textContent() || '').trim();
          } else {
            // Fallback: get text from the radio button itself or nearby text
            answer = (await radio.textContent() || '').trim();
          }
          await radio.click();
          selectedValues.push({ question, answer });
          processedGroups.add(groupId);
          await this.page.waitForTimeout(200);
        }
      }
    }

    return selectedValues;
  }

  async clickNext(): Promise<void> {
    await this.nextButton.waitFor({ state: 'visible', timeout: 10_000 });
    await this.nextButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async hasNextButton(): Promise<boolean> {
    return await this.nextButton.isVisible({ timeout: 2000 }).catch(() => false);
  }

  async clickSubmit(): Promise<void> {
    await this.submitButton.waitFor({ state: 'visible', timeout: 10_000 });
    await this.submitButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async hasSubmitButton(): Promise<boolean> {
    return await this.submitButton.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Fills the entire form by going through all screens,
   * selecting first option for all questions, and submitting
   * Returns an array of all question-answer pairs that were filled
   */
  async fillFormWithFirstOptions(): Promise<Array<{ question: string; answer: string }>> {
    await this.waitForFormToLoad();
    const allSelectedValues: Array<{ question: string; answer: string }> = [];
    
    // Keep going through screens until we reach the submit button
    while (await this.hasNextButton()) {
      const screenValues = await this.fillCurrentScreenWithFirstOptions();
      allSelectedValues.push(...screenValues);
      await this.clickNext();
      await this.waitForFormToLoad();
    }
    
    // Fill the last screen and submit
    if (await this.hasSubmitButton()) {
      const lastScreenValues = await this.fillCurrentScreenWithFirstOptions();
      allSelectedValues.push(...lastScreenValues);
      await this.clickSubmit();
    }
    
    return allSelectedValues;
  }
}
