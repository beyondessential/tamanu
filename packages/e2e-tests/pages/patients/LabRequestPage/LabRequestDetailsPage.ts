import { Page, Locator, expect } from '@playwright/test';
import { RecordSampleModal } from './modals/RecordSampleModal';
import { StatusLogModal } from './modals/StatusLogModal';
import { ChangeLaboratoryModal } from './modals/ChangeLaboratoryModal';
import { ChangePriorityModal } from './modals/ChangePriorityModal';
import { EnterResultsModal } from './modals/EnterResultsModal';

// Lab Request Status Constants
export const LAB_REQUEST_STATUS = {
  RECEPTION_PENDING: 'Reception pending',
  SAMPLE_NOT_COLLECTED: 'Sample not collected',
} as const;

export class LabRequestDetailsPage {
  readonly page: Page;

  // Main container
  readonly container!: Locator;
  
  // Lab request details card
  readonly labTestIdValue!: Locator;
  readonly requestDateValue!: Locator;
  readonly requestingClinicianValue!: Locator;
  readonly departmentValue!: Locator;
  
  // Action buttons
  readonly cancelRequestButton!: Locator;
  readonly threeDotsButton!: Locator;
  readonly statusThreeDotsbutton!: Locator;
  readonly sampleCollectedThreeDotsbutton!: Locator;
  readonly laboratoryThreeDotsbutton!: Locator;
  readonly priorityThreeDotsbutton!: Locator;
  readonly viewStatusLogsButton!: Locator;
  readonly recordSampleButton!: Locator;
  readonly changeStatusButton!: Locator;
  readonly changeLaboratoryButton!: Locator;
  readonly changePriorityButton!: Locator;
  readonly enterResultsButton!: Locator;
  readonly backButton!: Locator;
  
  // Notes section
  readonly notesList!: Locator;
  
  // Fixed tile row - lab request status tiles
  readonly testCategoryValue!: Locator;
  readonly statusValue!: Locator;
  readonly sampleCollectedValue!: Locator;
  readonly laboratoryValue!: Locator;
  readonly priorityValue!: Locator;
  
  // Results table
  readonly resultsTable!: Locator;
  readonly resultsTableBody!: Locator;
  

  //cancel modal
  readonly reasonForCancellationSelect!: Locator;
  readonly cancelModalConfirmButton!: Locator;

  //record sample modal
  readonly recordSampleModal: RecordSampleModal;
  
  //status log modal
  readonly statusLogModal: StatusLogModal;
  
  //change laboratory modal
  readonly changeLaboratoryModal: ChangeLaboratoryModal;
  
  //change priority modal
  readonly changePriorityModal: ChangePriorityModal;
  
  //enter results modal
  readonly enterResultsModal: EnterResultsModal;

  constructor(page: Page) {
    this.page = page;
    
    // TestId mapping for LabRequestDetailsPage elements
    const testIds = {
      container: 'container-pag3',
      labTestIdValue: 'cardvalue-wpiy',
      requestDateValue: 'cardvalue-bag0',
      requestingClinicianValue: 'cardvalue-tin5',
      departmentValue: 'cardvalue-l8vk',
      threeDotsButton: 'box-qy3e',
      changeStatusButton: 'labelcontainer-mjji',
      notesList: 'list-19gk',
      resultsTable: 'styledtable-1dlu',
      resultsTableBody: 'styledtablebody-a0jz',
      reasonForCancellationSelect: 'field-c7rc-select',
      cancelModalConfirmButton: 'formsubmitcancelrow-1ync-confirmButton',
    } as const;

    // Create locators using the testId mapping
    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }
    
    // Special cases that need additional processing
    this.cancelRequestButton = page.getByTestId('item-8ybn-1').getByText('Cancel request');
    this.threeDotsButton = page.getByTestId('box-qy3e').getByTestId('openbutton-d1ec');
    this.statusThreeDotsbutton = page.getByTestId('text-u1af').filter({ hasText: 'Status' }).locator('..').getByTestId('header-7mhd').getByTestId('openbutton-d1ec');
    this.viewStatusLogsButton = page.getByTestId('item-8ybn-1').getByText('View status log');
    this.sampleCollectedThreeDotsbutton = page.getByTestId('text-u1af').filter({ hasText: 'Sample collected' }).locator('..').getByTestId('header-7mhd').getByTestId('openbutton-d1ec');
    this.laboratoryThreeDotsbutton = page.getByTestId('text-u1af').filter({ hasText: 'Laboratory' }).locator('..').getByTestId('header-7mhd').getByTestId('openbutton-d1ec');
    this.priorityThreeDotsbutton = page.getByTestId('text-u1af').filter({ hasText: 'Priority' }).locator('..').getByTestId('header-7mhd').getByTestId('openbutton-d1ec');
    this.changeLaboratoryButton = page.getByTestId('item-8ybn-0').getByText('Change laboratory');
    this.changePriorityButton = page.getByTestId('item-8ybn-0').getByText('Change priority');
    this.recordSampleButton = page.getByTestId('item-8ybn-0').getByText('Record sample');
    this.enterResultsButton = page.getByTestId('button-oep6');
    this.backButton = page.getByTestId('backbutton-1n40');
    this.testCategoryValue = page.getByTestId('fixedtilerow-xxmq').locator('[data-testid="container-uk3i"]').first().getByTestId('main-vs6r');
    this.statusValue = page.getByTestId('fixedtilerow-xxmq').locator('[data-testid="container-uk3i"]').nth(1).getByTestId('tiletag-zdg8');
    this.sampleCollectedValue = page.getByTestId('fixedtilerow-xxmq').locator('[data-testid="container-uk3i"]').nth(2).getByTestId('tooltip-b4e8');
    this.laboratoryValue = page.getByTestId('fixedtilerow-xxmq').locator('[data-testid="container-uk3i"]').nth(3).getByTestId('main-vs6r');
    this.priorityValue = page.getByTestId('fixedtilerow-xxmq').locator('[data-testid="container-uk3i"]').nth(4).getByTestId('main-vs6r');

    //record sample modal
    this.recordSampleModal = new RecordSampleModal(page);
    
    //status log modal
    this.statusLogModal = new StatusLogModal(page);
    
    //change laboratory modal
    this.changeLaboratoryModal = new ChangeLaboratoryModal(page);
    
    //change priority modal
    this.changePriorityModal = new ChangePriorityModal(page);
    
    //enter results modal
    this.enterResultsModal = new EnterResultsModal(page);
  }

  async waitForPageToLoad() {
    await this.container.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async validateLabRequestDetails(
    expectedLabTestId: string,
    expectedRequestedDateTime: string,
    expectedRequestingClinician: string,
    expectedDepartment: string,
    expectedTestCategory: string,
    expectedStatus: string,
    expectedLaboratory: string,
    expectedPriority: string,
    expectedTestTypes: string[],
    expectedNotes: string[]
  ) {
    // Validate lab test ID
    await expect(this.labTestIdValue).toHaveText(expectedLabTestId);
    
    // Validate request date
    await expect(this.requestDateValue).toBeVisible();
    const actualRequestDate = await this.requestDateValue.textContent();
    expect(actualRequestDate).toContain(expectedRequestedDateTime.split(' ')[0]); // Compare date part
    
    // Validate requesting clinician
    await expect(this.requestingClinicianValue).toHaveText(expectedRequestingClinician);
    
    // Validate department
    await expect(this.departmentValue).toHaveText(expectedDepartment);
    
    // Validate test category
    await expect(this.testCategoryValue).toHaveText(expectedTestCategory);
    
    // Validate status
    await expect(this.statusValue).toHaveText(expectedStatus);
    
    // Validate sample collected info
    await expect(this.sampleCollectedValue).toBeVisible();
    
    // Validate laboratory
    await expect(this.laboratoryValue).toHaveText(expectedLaboratory);
    
    // Validate priority
    await expect(this.priorityValue).toHaveText(expectedPriority);
    
    // Validate results table is present
    await expect(this.resultsTable).toBeVisible();
    
    // Validate test types in results table
    for (const testType of expectedTestTypes) {
      const testTypeCell = this.resultsTableBody.locator(`[data-testid*="styledtablecell"][data-test-class*="labTestType.name"]`).filter({ hasText: testType });
      await expect(testTypeCell).toBeVisible();
    }
    // Validate notes
    for (const note of expectedNotes) {
      const noteCell = this.notesList.locator('li').filter({ hasText: note });
      await expect(noteCell).toContainText(note);
    }
  }

  async getLabTestId(): Promise<string> {
    return await this.labTestIdValue.textContent() || '';
  }

  async getRequestDate(): Promise<string> {
    return await this.requestDateValue.textContent() || '';
  }

  async getRequestingClinician(): Promise<string> {
    return await this.requestingClinicianValue.textContent() || '';
  }

  async getDepartment(): Promise<string> {
    return await this.departmentValue.textContent() || '';
  }

  async getTestCategory(): Promise<string> {
    return await this.testCategoryValue.textContent() || '';
  }

  async getStatus(): Promise<string> {
    return await this.statusValue.textContent() || '';
  }

  async getSampleCollectedDate(): Promise<string> {
    return await this.sampleCollectedValue.textContent() || '';
  }

  async getLaboratory(): Promise<string> {
    return await this.laboratoryValue.textContent() || '';
  }

  async getPriority(): Promise<string> {
    return await this.priorityValue.textContent() || '';
  }

  async getTestResults(): Promise<Array<{
    testType: string;
    result: string;
    units: string;
    reference: string;
    method: string;
    labOfficer: string;
    verification: string;
    completed: string;
  }>> {
    const rows = this.resultsTableBody.locator('tr');
    const results = [];
    
    for (let i = 0; i < await rows.count(); i++) {
      const row = rows.nth(i);
      const testType = await row.locator('[data-test-class*="labTestType.name"]').textContent() || '';
      const result = await row.locator('[data-test-class*="result"]').textContent() || '';
      const units = await row.locator('[data-test-class*="labTestType.unit"]').textContent() || '';
      const reference = await row.locator('[data-test-class*="reference"]').textContent() || '';
      const method = await row.locator('[data-test-class*="labTestMethod"]').textContent() || '';
      const labOfficer = await row.locator('[data-test-class*="laboratoryOfficer"]').textContent() || '';
      const verification = await row.locator('[data-test-class*="verification"]').textContent() || '';
      const completed = await row.locator('[data-test-class*="completedDate"]').textContent() || '';
      
      results.push({
        testType,
        result,
        units,
        reference,
        method,
        labOfficer,
        verification,
        completed
      });
    }
    
    return results;
  }

  async waitForResultsTableToLoad() {
    await this.enterResultsModal.waitForModalToClose();
    await this.resultsTable.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  /**
   * Enter result for the first row in the results table
   * @param result - The result value to select
   * @param labTestMethod - The lab test method to select
   * @param verification - The verification text to fill
   * @param completedDate - Optional completed date. If not provided, uses current date/time
   */
  async enterResultForFirstRow(
    result: string,
    labTestMethod: string,
    verification: string,
    completedDate?: string
  ): Promise<void> {
    await this.enterResultsButton.click();
    await this.enterResultsModal.waitForModalToLoad();
    await this.enterResultsModal.selectResult(result);
    await this.enterResultsModal.selectLabTestMethod(labTestMethod);
    await this.enterResultsModal.verificationFirstRow.fill(verification);
    const dateToUse = completedDate || new Date().toISOString().slice(0, 16);
    await this.enterResultsModal.completedDateFirstRow.fill(dateToUse);
    await this.enterResultsModal.confirmButton.click();
  }
}
