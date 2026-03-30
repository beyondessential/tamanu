import { Locator, Page, expect } from '@playwright/test';
import { ids, TABLE_CELL_PREFIX } from '@ids';
import { fillDateTime } from '@helpers/dates';
import { selectFirstFromListbox } from '@helpers/fields';

export const LAB_REQUEST_STATUS = {
  SAMPLE_NOT_COLLECTED: 'Sample not collected',
  RECEPTION_PENDING: 'Reception pending',
  RESULTS_PENDING: 'Results pending',
  TO_BE_VERIFIED: 'To be verified',
  VERIFIED: 'Verified',
  PUBLISHED: 'Published',
  CANCELLED: 'Cancelled',
} as const;

// ---------------------------------------------------------------------------
// Lab Request Details Page
// ---------------------------------------------------------------------------

export class LabRequestDetailsPage {
  // Tiles
  readonly testCategoryValue: Locator;
  readonly statusValue: Locator;
  readonly sampleCollectedValue: Locator;
  readonly laboratoryValue: Locator;
  readonly priorityValue: Locator;

  // Actions
  readonly backButton: Locator;
  readonly statusLogButton: Locator;
  readonly expandButton: Locator;
  readonly cancelButton: Locator;
  readonly changeLaboratoryButton: Locator;

  // Record sample modal
  readonly recordSampleForm: Locator;
  readonly sampleDateTimeInput: Locator;
  readonly sampleCollectedByInput: Locator;
  readonly sampleSpecimenTypeInput: Locator;
  readonly sampleSiteDropdownIcon: Locator;
  readonly sampleConfirmButton: Locator;

  // Change laboratory modal
  readonly changeLabForm: Locator;
  readonly changeLabInput: Locator;
  readonly changeLabConfirm: Locator;
  readonly changeLabCancel: Locator;

  // Change priority modal
  readonly changePriorityForm: Locator;
  readonly changePriorityInput: Locator;
  readonly changePriorityConfirm: Locator;

  // Status log modal
  readonly statusLogContent: Locator;
  readonly statusLogTableBody: Locator;

  // Enter results modal
  readonly enterResultsContainer: Locator;
  readonly enterResultsForm: Locator;
  readonly enterResultsConfirm: Locator;
  readonly resultFirstRow: Locator;
  readonly verificationFirstRow: Locator;
  readonly completedDateFirstRow: Locator;
  readonly labTestMethodExpandIcon: Locator;

  constructor(readonly page: Page) {
    const tile = page.getByTestId(ids.labDetails.tileRow);
    const containers = tile.locator(`[data-testid="${ids.labDetails.tileContainer}"]`);

    this.testCategoryValue = containers.first().getByTestId(ids.labDetails.tileMain);
    this.statusValue = containers.nth(1).getByTestId(ids.labDetails.tileTag);
    this.sampleCollectedValue = containers.nth(2).getByTestId(ids.labDetails.sampleCollectedDate);
    this.laboratoryValue = containers.nth(3).getByTestId(ids.labDetails.tileMain);
    this.priorityValue = containers.nth(4).getByTestId(ids.labDetails.tileMain);

    this.backButton = page.getByTestId(ids.labDetails.backButton);
    this.statusLogButton = page.getByTestId(ids.labDetails.statusLogButton);
    this.expandButton = page.getByTestId(ids.labDetails.expandButton);
    this.cancelButton = page.getByTestId(ids.labDetails.cancelItem);
    this.changeLaboratoryButton = page.getByTestId(ids.labDetails.changeLaboratoryButton);

    // Record sample
    this.recordSampleForm = page.getByTestId(ids.recordSample.form);
    this.sampleDateTimeInput = page.getByTestId(ids.recordSample.dateTimeInput);
    this.sampleCollectedByInput = page.getByTestId(ids.recordSample.collectedByInput);
    this.sampleSpecimenTypeInput = page.getByTestId(ids.recordSample.specimenTypeInput);
    this.sampleSiteDropdownIcon = this.recordSampleForm.getByTestId(ids.recordSample.siteDropdownIcon);
    this.sampleConfirmButton = page.getByTestId(ids.recordSample.confirmButton);

    // Change laboratory
    this.changeLabForm = page.getByTestId(ids.changeLab.form);
    this.changeLabInput = page.getByTestId(ids.changeLab.laboratoryInput).locator('input');
    this.changeLabConfirm = page.getByTestId(ids.changeLab.confirmButton);
    this.changeLabCancel = page.getByTestId(ids.changeLab.cancelButton);

    // Change priority
    this.changePriorityForm = page.getByTestId(ids.changePriority.form);
    this.changePriorityInput = page.getByTestId(ids.changePriority.priorityInput).locator('input');
    this.changePriorityConfirm = page.getByTestId(ids.changePriority.confirmButton);

    // Status log
    this.statusLogContent = page.getByTestId(ids.statusLog.content);
    this.statusLogTableBody = this.statusLogContent.getByTestId(ids.table.body);

    // Enter results
    const dataCellPrefix = ids.enterResults.dataCellPrefix;
    this.enterResultsContainer = page.getByTestId(ids.enterResults.container);
    this.enterResultsForm = page.getByTestId(ids.enterResults.form);
    this.enterResultsConfirm = page.getByTestId(ids.enterResults.confirmButton);
    this.resultFirstRow = page.getByTestId(`${dataCellPrefix}-0-result`).locator('input');
    this.verificationFirstRow = page.getByTestId(`${dataCellPrefix}-0-verification`).locator('input');
    this.completedDateFirstRow = page.getByTestId(`${dataCellPrefix}-0-completedDate`).locator('input');
    this.labTestMethodExpandIcon = page.getByTestId(ids.enterResults.methodExpandIcon);
  }

  async waitForPageToLoad(): Promise<void> {
    await this.testCategoryValue.waitFor({ state: 'visible' });
  }

  async validateLabRequestDetails(
    category: string,
    status: string,
    laboratory: string,
    priority: string,
  ): Promise<void> {
    await expect(this.testCategoryValue).toHaveText(category);
    await expect(this.statusValue).toHaveText(status);
    await expect(this.laboratoryValue).toHaveText(laboratory);
    await expect(this.priorityValue).toHaveText(priority);
  }

  // -- Record sample --

  async recordSample(dateTime: string): Promise<void> {
    await this.recordSampleForm.waitFor({ state: 'visible' });
    await fillDateTime(this.sampleDateTimeInput, dateTime);
    await selectFirstFromListbox(this.page, this.sampleCollectedByInput);
    await selectFirstFromListbox(this.page, this.sampleSpecimenTypeInput);
    await this.sampleSiteDropdownIcon.click();
    await this.page.keyboard.press('Enter');
    await this.sampleConfirmButton.click();
    await this.recordSampleForm.waitFor({ state: 'detached' });
  }

  // -- Status log --

  async openStatusLog(): Promise<void> {
    await this.expandButton.click();
    await this.statusLogButton.click();
  }

  async getStatusLogRowCount(): Promise<number> {
    return this.statusLogTableBody.locator('tr').count();
  }

  // -- Change laboratory --

  async changeLaboratory(labName: string): Promise<void> {
    await this.changeLaboratoryButton.click();
    await this.changeLabForm.waitFor({ state: 'visible' });
    await this.changeLabInput.fill(labName);
    await this.page.getByRole('menuitem', { name: labName }).click();
    await this.changeLabConfirm.click();
    await this.changeLabForm.waitFor({ state: 'detached' });
  }

  // -- Change priority --

  async changePriority(): Promise<string> {
    await this.expandButton.click();
    await this.page.getByText('Change priority').click();
    await this.changePriorityForm.waitFor({ state: 'visible' });
    await this.changePriorityInput.click();
    const option = this.page.locator('[role="listbox"] li').first();
    const text = (await option.textContent()) || '';
    await option.click();
    await this.changePriorityConfirm.click();
    await this.changePriorityForm.waitFor({ state: 'detached' });
    return text;
  }

  // -- Enter results --

  async selectLabTestMethod(): Promise<void> {
    await this.labTestMethodExpandIcon.click();
    await this.page.getByTestId(ids.enterResults.methodOption).first().click();
  }

  async enterResults(
    result: string,
    verification: string,
    completedDate?: string,
  ): Promise<void> {
    await this.enterResultsContainer.waitFor({ state: 'visible' });
    await this.resultFirstRow.fill(result);
    await this.selectLabTestMethod();
    await this.verificationFirstRow.fill(verification);
    if (completedDate) {
      await fillDateTime(this.completedDateFirstRow, completedDate);
    }
    await this.enterResultsConfirm.click();
  }
}
