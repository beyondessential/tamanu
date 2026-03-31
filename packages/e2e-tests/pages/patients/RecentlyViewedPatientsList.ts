import { Locator, Page } from '@playwright/test';
import { convertDateFormat } from '../../utils/testHelper';
import { assignTestIdLocators } from '../../utils/locatorFactory';
import { RecentlyViewedPatient } from '../../types/Patient';

export class RecentlyViewedPatientsList {
  readonly firstRecentlyViewedName!: Locator;
  readonly firstRecentlyViewedNHN!: Locator;
  readonly firstRecentlyViewedGender!: Locator;
  readonly firstRecentlyViewedBirthDate!: Locator;
  readonly navigateNext!: Locator;
  private page: Page;

  constructor(page: Page) {
    this.page = page;

    assignTestIdLocators(this, page, {
      firstRecentlyViewedName: 'cardtitle-qqhk-0',
      firstRecentlyViewedNHN: 'cardtext-iro1-0',
      firstRecentlyViewedGender: 'capitalizedcardtext-zu58-0',
      navigateNext: 'navigatenext-zeo2',
    });

    this.firstRecentlyViewedBirthDate = page.getByTestId('cardtext-i2bu-0').getByTestId('datedisplay-tw5s-0');
  }

  static formatDateForRecentlyViewed(dateOfBirth: string): string {
    const formatted = dateOfBirth.includes('/') ? dateOfBirth : convertDateFormat(dateOfBirth);

    const [month, day, year] = formatted.split('/');
    const shortYear = year.slice(-2);
    return `${month}/${day}/${shortYear}`;
  }

  async getRecentlyViewedPatientNameColor(): Promise<string> {
    const color = await this.firstRecentlyViewedName.evaluate((element) => {
      const computedStyle = window.getComputedStyle(element);
      return computedStyle.color;
    });
    return color;
  }

  async getRecentlyViewedPatientByIndex(index: number): Promise<RecentlyViewedPatient> {
    const patient = {
      name: this.page.getByTestId(`cardtitle-qqhk-${index}`),
      nhn: this.page.getByTestId(`cardtext-iro1-${index}`),
      gender: this.page.getByTestId(`capitalizedcardtext-zu58-${index}`),
      birthDate: this.page.getByTestId(`cardtext-i2bu-${index}`).getByTestId(`datedisplay-tw5s-${index}`)
    };

    return {
      name: await patient.name.textContent() || '',
      nhn: await patient.nhn.textContent() || '',
      gender: await patient.gender.textContent() || '',
      birthDate: await patient.birthDate.textContent() || ''
    };
  }
} 