import { Locator, Page } from '@playwright/test';
import { selectAutocompleteFieldOption } from '@utils/fieldHelpers';
import { assignTestIdLocators } from '@utils/locatorFactory';

export class ChangeLocationModal {
  readonly page: Page;

  readonly areaInput!: Locator;
  readonly newLocationInput!: Locator;
  readonly cancelButton!: Locator;
  readonly confirmButton!: Locator;
  newLocationOptions!: Locator;

  constructor(page: Page) {
    this.page = page;

    assignTestIdLocators(this, page, {
      areaInput: 'field-tykg-group-input',
      newLocationInput: 'field-tykg-location-input',
      cancelButton: 'outlinedbutton-8rnr',
      confirmButton: 'formsubmitcancelrow-35ou-confirmButton',
      newLocationOptions: 'field-tykg-location-option-typography',
    });
  }

  async waitForModalToLoad(): Promise<void> {
    await this.areaInput.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async changeArea(area: string): Promise<void> {
    await selectAutocompleteFieldOption(this.page, this.areaInput, {
      optionToSelect: area,
      returnOptionText: true,
    });
  }

  async changeLocation(location: string): Promise<void> {
   await this.newLocationInput.click();
   await this.newLocationOptions.filter({ hasText: location }).click(); 
  }
}

