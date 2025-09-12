import { Page, Locator, expect } from '@playwright/test';
import { RecordSampleModal } from './modals/RecordSampleModal';
import { StatusLogModal } from './modals/StatusLogModal';
import { ChangeLaboratoryModal } from './modals/ChangeLaboratoryModal';
import { ChangePriorityModal } from './modals/ChangePriorityModal';
import { EnterResultsModal } from './modals/EnterResultsModal';

export class LabRequestDetailsPage {
  readonly page: Page;

  // Main container
  readonly container: Locator;
  readonly topContainer: Locator;
  readonly bottomContainer: Locator;
  
  // Header section
  readonly heading: Locator;
  readonly labIcon: Locator;
  
  // Lab request details card
  readonly labTestIdLabel: Locator;
  readonly labTestIdValue: Locator;
  readonly requestDateLabel: Locator;
  readonly requestDateValue: Locator;
  readonly requestingClinicianLabel: Locator;
  readonly requestingClinicianValue: Locator;
  readonly departmentLabel: Locator;
  readonly departmentValue: Locator;
  
  // Action buttons
  readonly cancelButton: Locator;
  readonly threeDotsButton: Locator;
  readonly statusThreeDotsbutton: Locator;
  readonly sampleCollectedThreeDotsbutton: Locator;
  readonly laboratoryThreeDotsbutton: Locator;
  readonly priorityThreeDotsbutton: Locator;
  readonly viewStatusLogsButton: Locator;
  readonly recordSampleButton: Locator;
  readonly changeStatusButton: Locator;
  readonly changeLaboratoryButton: Locator;
  readonly changePriorityButton: Locator;
  readonly printRequestButton: Locator;
  readonly enterResultsButton: Locator;
  readonly addNoteButton: Locator;
  readonly backButton: Locator;
  
  // Notes section
  readonly notesIcon: Locator;
  readonly notesList: Locator;
  readonly addNoteForm: Locator;
  readonly showAddNoteFormButton: Locator;
  
  // Fixed tile row - lab request status tiles
  readonly testCategoryTile: Locator;
  readonly testCategoryValue: Locator;
  readonly statusTile: Locator;
  readonly statusValue: Locator;
  readonly sampleCollectedTile: Locator;
  readonly sampleCollectedValue: Locator;
  readonly laboratoryTile: Locator;
  readonly laboratoryValue: Locator;
  readonly priorityTile: Locator;
  readonly priorityValue: Locator;
  
  // Results table
  readonly resultsTable: Locator;
  readonly resultsTableHead: Locator;
  readonly resultsTableBody: Locator;
  readonly resultsTableFooter: Locator;
  readonly downloadButton: Locator;
  
  // Table columns
  readonly testTypeColumn: Locator;
  readonly resultColumn: Locator;
  readonly unitsColumn: Locator;
  readonly referenceColumn: Locator;
  readonly methodColumn: Locator;
  readonly labOfficerColumn: Locator;
  readonly verificationColumn: Locator;
  readonly completedColumn: Locator;

  //cancel modal
  readonly reasonForCancellationSelect: Locator;
  readonly cancelModalCancelButton: Locator;
  readonly cancelModalConfirmButton: Locator;

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
    
    // Main containers
    this.container = page.getByTestId('container-pag3');
    this.topContainer = page.getByTestId('topcontainer-ikm7');
    this.bottomContainer = page.getByTestId('bottomcontainer-7egh');
    
    // Header section
    this.heading = page.getByTestId('heading2-fg64');
    this.labIcon = page.getByTestId('labicon-e74e');
    
    // Lab request details card
    this.labTestIdLabel = page.getByTestId('cardlabel-9yw2');
    this.labTestIdValue = page.getByTestId('cardvalue-wpiy');
    this.requestDateLabel = page.getByTestId('cardlabel-hqix');
    this.requestDateValue = page.getByTestId('cardvalue-bag0');
    this.requestingClinicianLabel = page.getByTestId('cardlabel-hifd');
    this.requestingClinicianValue = page.getByTestId('cardvalue-tin5');
    this.departmentLabel = page.getByTestId('cardlabel-cuwo');
    this.departmentValue = page.getByTestId('cardvalue-l8vk');
    
    // Action buttons
    this.cancelButton = page.getByTestId('item-8ybn-1');
    this.threeDotsButton = page.getByTestId('box-qy3e').getByTestId('openbutton-d1ec');
    this.statusThreeDotsbutton = page.getByTestId('header-7mhd').getByTestId('openbutton-d1ec').nth(0);
    this.changeStatusButton = page.getByTestId('labelcontainer-mjji');
    this.viewStatusLogsButton = page.getByTestId('item-8ybn-1');
    this.sampleCollectedThreeDotsbutton = page.getByTestId('header-7mhd').getByTestId('openbutton-d1ec').nth(1);
    this.laboratoryThreeDotsbutton = page.getByTestId('header-7mhd').getByTestId('openbutton-d1ec').nth(2);
    this.priorityThreeDotsbutton = page.getByTestId('header-7mhd').getByTestId('openbutton-d1ec').nth(3);
    this.changeLaboratoryButton = page.getByTestId('item-8ybn-0');
    this.changePriorityButton = page.getByTestId('item-8ybn-0');
    this.recordSampleButton = page.getByTestId('item-8ybn-0');
    this.printRequestButton = page.getByTestId('outlinedbutton-fdjm');
    this.enterResultsButton = page.getByTestId('button-oep6');
    this.addNoteButton = page.getByTestId('showaddnoteformbutton-thpi');
    this.backButton = page.getByTestId('backbutton-1n40');
    // Notes section
    this.notesIcon = page.getByTestId('notesicon-4qul');
    this.notesList = page.getByTestId('list-19gk');
    this.addNoteForm = page.getByTestId('styledform-5o5i');
    this.showAddNoteFormButton = page.getByTestId('showaddnoteformbutton-thpi');
    
    // Fixed tile row - lab request status tiles
    this.testCategoryTile = page.getByTestId('fixedtilerow-xxmq').locator('[data-testid="container-uk3i"]').first();
    this.testCategoryValue = this.testCategoryTile.getByTestId('main-vs6r');
    this.statusTile = page.getByTestId('fixedtilerow-xxmq').locator('[data-testid="container-uk3i"]').nth(1);
    this.statusValue = this.statusTile.getByTestId('tiletag-zdg8');
    this.sampleCollectedTile = page.getByTestId('fixedtilerow-xxmq').locator('[data-testid="container-uk3i"]').nth(2);
    this.sampleCollectedValue = this.sampleCollectedTile.getByTestId('tooltip-b4e8');
    this.laboratoryTile = page.getByTestId('fixedtilerow-xxmq').locator('[data-testid="container-uk3i"]').nth(3);
    this.laboratoryValue = this.laboratoryTile.getByTestId('main-vs6r');
    this.priorityTile = page.getByTestId('fixedtilerow-xxmq').locator('[data-testid="container-uk3i"]').nth(4);
    this.priorityValue = this.priorityTile.getByTestId('main-vs6r');
    
    // Results table
    this.resultsTable = page.getByTestId('styledtable-1dlu');
    this.resultsTableHead = page.getByTestId('styledtablehead-ays3');
    this.resultsTableBody = page.getByTestId('styledtablebody-a0jz');
    this.resultsTableFooter = page.getByTestId('styledtablefooter-7pgn');
    this.downloadButton = page.getByTestId('download-data-button');
    
    // Table columns
    this.testTypeColumn = page.getByTestId('tablesortlabel-0qxx-labTestType.name');
    this.resultColumn = page.getByTestId('tablesortlabel-0qxx-result');
    this.unitsColumn = page.getByTestId('tablesortlabel-0qxx-labTestType.unit');
    this.referenceColumn = page.getByTestId('tablelabel-0eff-reference');
    this.methodColumn = page.getByTestId('tablelabel-0eff-labTestMethod');
    this.labOfficerColumn = page.getByTestId('tablesortlabel-0qxx-laboratoryOfficer');
    this.verificationColumn = page.getByTestId('tablesortlabel-0qxx-verification');
    this.completedColumn = page.getByTestId('tablelabel-0eff-completedDate');

    //cancel modal
    this.reasonForCancellationSelect = page.getByTestId('field-c7rc-select');
    this.cancelModalCancelButton = page.getByTestId('formsubmitcancelrow-aaiz-cancelButton');
    this.cancelModalConfirmButton = page.getByTestId('formsubmitcancelrow-1ync-confirmButton');

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

  async clickEnterResults() {
    await this.enterResultsButton.click();
  }

  async clickPrintRequest() {
    await this.printRequestButton.click();
  }

  async clickAddNote() {
    await this.addNoteButton.click();
  }

  async clickDownloadResults() {
    await this.downloadButton.click();
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
}
