import { Locator, Page, expect } from '@playwright/test';
import { PatientDetailsPage } from '@pages/patients/PatientDetailsPage';
import { createApiContext, getUser } from '../../../../utils/apiHelpers';
import { format } from 'date-fns';

export class LabRequestModalBase {
  readonly page: Page;
  readonly form: Locator;
  readonly heading: Locator;
  readonly description: Locator;
  
  // Page 1: Basic lab request details (shared across all modals)
  readonly requestingClinicianInput: Locator;
  readonly requestDateTimeInput: Locator;
  readonly departmentInput: Locator;
  readonly prioritySelect: Locator;
  readonly panelRadioButton: Locator;
  readonly individualRadioButton: Locator;
  
  // Action buttons (shared across all modals)
  readonly backButton: Locator;
  readonly cancelButton: Locator;
  readonly nextButton: Locator;
  readonly finaliseButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.form = page.getByTestId('styledform-5o5i');
    this.heading = page.getByTestId('heading3-keat');
    this.description = page.getByTestId('styledbodytext-8egc');
    
    // Page 1: Basic lab request details
    this.requestingClinicianInput = page.getByTestId('field-z6gb-input').locator('input');
    this.requestDateTimeInput = page.getByTestId('field-y6ku-input').locator('input');
    this.departmentInput = page.getByTestId('field-wobc-input').locator('input');
    this.prioritySelect = page.getByTestId('selectinput-phtg-select');
    this.panelRadioButton = page.getByTestId('radio-il3t-panel');
    this.individualRadioButton = page.getByTestId('radio-il3t-individual');
    
    // Action buttons
    this.backButton = page.getByTestId('styledbackbutton-016f');
    this.cancelButton = page.getByTestId('formgrid-wses').getByTestId('outlinedbutton-8rnr');
    this.nextButton = page.getByTestId('formsubmitcancelrow-aaiz-confirmButton');
    this.finaliseButton = page.getByTestId('formsubmitcancelrow-aaiz-confirmButton');
  }

  async waitForModalToLoad() {
    await this.requestingClinicianInput.waitFor({ state: 'visible' });
  }

  async validateRequestedDateTimeIsToday() {
    const todayString = this.getCurrentDateTime();
    await expect(this.requestDateTimeInput).toHaveValue(todayString);
    return todayString;
  }

  async validateDepartment() {
    const patientDetailsPage = new PatientDetailsPage(this.page);
    const departmentLabel = await patientDetailsPage.departmentLabel.textContent();
    await expect(this.departmentInput).toHaveValue(departmentLabel || '');
    return departmentLabel;
  }

  async validateRequestingClinician() {
    const currentUser = await this.getCurrentUser();
    await expect(this.requestingClinicianInput).toHaveValue(currentUser.displayName); 
    return currentUser.displayName;
  }

  async getCurrentUser() {
    const api = await createApiContext({ page: this.page });
    const currentUser = await getUser(api);
    return currentUser;
  }

  getCurrentDateTime(): string {
    return format(new Date(), "yyyy-MM-dd'T'HH:mm");
  }
} 