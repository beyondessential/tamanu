import { Locator, Page } from '@playwright/test';

import { BasePage } from '../BasePage';
import { PatientSurveyFormPane } from '../patientForm/PatientSurveyFormPane';
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
  readonly noMatchTitle: Locator;
  readonly noMatchSearchedDetails: Locator;
  readonly editDetailsButton: Locator;
  readonly readyToCheckInTitle: Locator;
  readonly startOverButton: Locator;
  readonly startOverDialog: Locator;
  readonly form: PatientSurveyFormPane;

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
    this.noMatchTitle = page.getByText("We couldn't find your appointment");
    this.noMatchSearchedDetails = page.getByRole('definition');
    this.editDetailsButton = page.getByRole('button', { name: 'Edit details' });
    this.readyToCheckInTitle = page.getByText("You're ready to check in");
    this.startOverButton = page.locator('header').getByRole('button', { name: 'Start over' });
    this.startOverDialog = page.getByRole('dialog', { name: 'Start over?' });
    this.form = new PatientSurveyFormPane(page);
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

  async findAndConfirmAppointment(lastName: string, dateOfBirth: string) {
    await this.findAppointment(lastName, dateOfBirth);
    await this.confirmButton.click();
  }

  async startOver() {
    await this.startOverButton.click();
    await this.startOverDialog.getByRole('button', { name: 'Start over' }).click();
  }

  async checkIn(lastName: string, dateOfBirth: string) {
    await this.findAndConfirmAppointment(lastName, dateOfBirth);
    await this.checkInButton.click();
  }
}
