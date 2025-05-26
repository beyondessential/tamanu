import { Locator } from '@playwright/test';
import { BasePage } from '../BasePage';

export class recentlyViewedPatientPage extends BasePage {
  readonly firstRecentlyViewedName: Locator
  readonly firstRecentlyViewedNHN: Locator
  readonly firstRecentlyViewedGender: Locator
  readonly firstRecentlyViewedBirthDate: Locator
  constructor(page) {
    super(page);
    this.firstRecentlyViewedName=page.getByTestId('cardtitle-qqhk-0')
    this.firstRecentlyViewedNHN=page.getByTestId('cardtext-iro1-0')
    this.firstRecentlyViewedGender=page.getByTestId('capitalizedcardtext-zu58-0');
    this.firstRecentlyViewedBirthDate=page.getByTestId('cardtext-i2bu-0').getByTestId('tooltip-b4e8');
  }
}
