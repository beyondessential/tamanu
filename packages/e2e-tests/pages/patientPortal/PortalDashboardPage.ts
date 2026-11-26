import { Locator, Page } from '@playwright/test';

import { PatientPortalBasePage } from './PatientPortalBasePage';
import { routes } from '../../config/routes';

export class PortalDashboardPage extends PatientPortalBasePage {
  readonly toDoSection: Locator;
  readonly allUpToDateText: Locator;
  readonly detailsSection: Locator;
  readonly editDetailsLink: Locator;
  readonly menuButton: Locator;
  readonly logOutButton: Locator;
  readonly formSubmittedMessage: Locator;
  readonly detailsSavedMessage: Locator;

  constructor(page: Page) {
    super(page, routes.patientPortal.dashboard);
    this.toDoSection = page.getByRole('region', { name: 'To do' });
    this.allUpToDateText = this.toDoSection.getByText("You're all up to date");
    this.detailsSection = page.getByRole('region', { name: 'Your details' });
    this.editDetailsLink = this.detailsSection.getByRole('link', { name: 'Edit' });
    this.menuButton = page.getByRole('button', { name: 'Open menu' });
    this.logOutButton = page.getByRole('button', { name: 'Log out' });
    this.formSubmittedMessage = page.getByText('Form submitted');
    this.detailsSavedMessage = page.getByText('Details saved');
  }

  greeting(firstName: string) {
    return this.page.getByRole('heading', { name: `Hi ${firstName}` });
  }

  /** The row in To do that opens a form the patient has been sent. */
  formToFillIn(formName: string) {
    return this.toDoSection.getByRole('link', { name: formName });
  }

  async logOut() {
    await this.menuButton.click();
    await this.logOutButton.click();
  }
}
