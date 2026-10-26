import { Locator, Page } from '@playwright/test';

import { BasePage } from '../BasePage';
import { routes } from '../../config/routes';

export class KioskPage extends BasePage {
  readonly startButton: Locator;
  readonly lastNameInput: Locator;
  readonly dobDayInput: Locator;
  readonly dobMonthSelect: Locator;
  readonly dobYearInput: Locator;
  readonly findButton: Locator;
  readonly confirmButton: Locator;
  readonly checkInButton: Locator;
  readonly doneButton: Locator;
  readonly checkedInTitle: Locator;
  readonly alreadyCheckedInTitle: Locator;
  readonly notPermittedText: Locator;

  constructor(page: Page) {
    super(page, routes.kiosk);
    this.startButton = page.getByTestId('kiosk-start');
    this.lastNameInput = page.getByTestId('kiosk-last-name');
    this.dobDayInput = page.getByTestId('kiosk-dob-day');
    this.dobMonthSelect = page.getByTestId('kiosk-dob-month');
    this.dobYearInput = page.getByTestId('kiosk-dob-year');
    this.findButton = page.getByTestId('kiosk-find');
    this.confirmButton = page.getByTestId('kiosk-confirm');
    this.checkInButton = page.getByTestId('kiosk-check-in');
    this.doneButton = page.getByTestId('kiosk-done');
    this.checkedInTitle = page.getByText("You're checked in");
    this.alreadyCheckedInTitle = page.getByText("You're already checked in");
    this.notPermittedText = page.getByText(
      "The account signed in here doesn't have permission to run the self check-in kiosk.",
    );
  }

  /** `dateOfBirth` is the patient's stored date, `yyyy-MM-dd`. */
  async findAppointment(lastName: string, dateOfBirth: string) {
    const [year, month, day] = dateOfBirth.split('-');
    await this.startButton.click();
    await this.lastNameInput.fill(lastName);
    await this.dobDayInput.fill(String(Number(day)));
    await this.dobMonthSelect.selectOption(String(Number(month)));
    await this.dobYearInput.fill(year);
    await this.findButton.click();
  }

  async checkIn(lastName: string, dateOfBirth: string) {
    await this.findAppointment(lastName, dateOfBirth);
    await this.confirmButton.click();
    await this.checkInButton.click();
  }
}
