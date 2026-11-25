import { Locator, Page } from '@playwright/test';

import { PatientPortalBasePage } from './PatientPortalBasePage';
import { routes } from '../../config/routes';

/** Where the patient keeps their own contact and other changeable details up to date. */
export class PortalEditDetailsPage extends PatientPortalBasePage {
  readonly title: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page, routes.patientPortal.editDetails);
    this.title = page.getByRole('heading', { name: 'Edit your details' });
    this.saveButton = page.getByRole('button', { name: 'Save' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
  }

  /** An editable detail, by its label. */
  detail(label: string) {
    return this.page.getByLabel(label, { exact: true });
  }
}
