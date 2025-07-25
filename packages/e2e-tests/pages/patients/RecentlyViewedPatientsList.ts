import { Locator, Page } from '@playwright/test';
import { convertDateFormat } from '../../utils/testHelper';
import { RecentlyViewedPatient } from '../../types/Patient';

export class RecentlyViewedPatientsList {
  readonly firstRecentlyViewedName: Locator;
  readonly firstRecentlyViewedNHN: Locator;
  readonly firstRecentlyViewedGender: Locator;
  readonly firstRecentlyViewedBirthDate: Locator;
  readonly navigateNext: Locator;
  private page: Page;

  constructor(page: Page) {
    this.page = page;
    this.firstRecentlyViewedName = page.getByTestId('cardtitle-qqhk-0');
    this.firstRecentlyViewedNHN = page.getByTestId('cardtext-iro1-0');
    this.firstRecentlyViewedGender = page.getByTestId('capitalizedcardtext-zu58-0');
    this.firstRecentlyViewedBirthDate = page.getByTestId('cardtext-i2bu-0').getByTestId('tooltip-b4e8');
    this.navigateNext = page.getByTestId('navigatenext-zeo2');
  }

  formatDateForRecentlyViewed(dateOfBirth: string): string {
    if (!dateOfBirth.includes('/')) {
      dateOfBirth = convertDateFormat(dateOfBirth);
    }
   
    const [month, day, year] = dateOfBirth.split('/');
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
      birthDate: this.page.getByTestId(`cardtext-i2bu-${index}`).getByTestId('tooltip-b4e8')
    };

    return {
      name: await patient.name.textContent() || '',
      nhn: await patient.nhn.textContent() || '',
      gender: await patient.gender.textContent() || '',
      birthDate: await patient.birthDate.textContent() || ''
    };
  }

  async waitForFirstRecentlyViewedPatientToHaveNHN(expectedNHN: string, timeout: number = 15000): Promise<void> {
    const { expect } = await import('@playwright/test');
    await expect.poll(
      async () => {
        const text = await this.firstRecentlyViewedNHN.textContent();
        return text === expectedNHN;
      },
      { timeout }
    ).toBeTruthy();
  }

  async waitForFirstRecentlyViewedPatientToHaveColor(expectedColor: string, timeout: number = 15000): Promise<void> {
    const { expect } = await import('@playwright/test');
    await expect.poll(
      async () => {
        const color = await this.getRecentlyViewedPatientNameColor();
        return color === expectedColor;
      },
      { timeout }
    ).toBeTruthy();
  }
} 