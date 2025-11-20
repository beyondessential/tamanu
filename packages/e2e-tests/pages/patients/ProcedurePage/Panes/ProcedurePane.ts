import { Locator, Page } from '@playwright/test';
import { BasePatientPane } from '../../PatientDetailsPage/panes/BasePatientPane';
import { NewProcedureModal } from '../Modals/NewProcedureModal';

export class ProcedurePane extends BasePatientPane {
  readonly tabPane!: Locator;
  readonly styledForm!: Locator;
  readonly newProcedureButton!: Locator;
  readonly tableContainer!: Locator;
  readonly table!: Locator;
  readonly tableHead!: Locator;
  readonly tableBody!: Locator;
  readonly tableFooter!: Locator;
  
  // Table headers
  readonly dateColumnHeader!: Locator;
  readonly codeColumnHeader!: Locator;
  readonly procedureColumnHeader!: Locator;
  
  // Table cells
  readonly dateCell!: Locator;
  readonly codeCell!: Locator;
  readonly procedureCell!: Locator;
  
  // Footer elements
  readonly downloadButton!: Locator;
  readonly paginatorWrapper!: Locator;
  readonly footerContent!: Locator;
  readonly pageRecordCount!: Locator;
  readonly pageSizeSelect!: Locator;
  readonly pagination!: Locator;
  readonly previousPageButton!: Locator;
  readonly page1Button!: Locator;
  readonly nextPageButton!: Locator;
  
  // Modal
  newProcedureModal?: NewProcedureModal;

  constructor(page: Page) {
    super(page);

    // TestId mapping for ProcedurePane elements
    const testIds = {
      tabPane: 'tabpane-q1xp',
      styledForm: 'styledform-5o5i',
      newProcedureButton: 'component-enxe',
      tableContainer: 'styledtablecontainer-3ttp',
      table: 'styledtable-1dlu',
      tableHead: 'styledtablehead-ays3',
      tableBody: 'styledtablebody-a0jz',
      tableFooter: 'styledtablefooter-7pgn',
      dateColumnHeader: 'tablesortlabel-0qxx-date',
      codeColumnHeader: 'tablesortlabel-0qxx-ProcedureType.code',
      procedureColumnHeader: 'tablesortlabel-0qxx-ProcedureType.name',
      dateCell: 'styledtablecell-2gyy-0-date',
      codeCell: 'styledtablecell-2gyy-0-ProcedureType.code',
      procedureCell: 'styledtablecell-2gyy-0-ProcedureType.name',
      downloadButton: 'download-data-button',
      paginatorWrapper: 'paginatorwrapper-l9c5',
      footerContent: 'footercontent-yb09',
      pageRecordCount: 'pagerecordcount-m8ne',
      pageSizeSelect: 'styledselectfield-lunn',
      pagination: 'styledpagination-fbr1',
      previousPageButton: 'paginationitem-hcui',
      page1Button: 'paginationitem-c5vg',
      nextPageButton: 'paginationitem-d791',
    } as const;

    // Create locators using the testId mapping
    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = this.page.getByTestId(id);
    }
  }

  /**
   * Get the New Procedure Modal instance
   */
  getNewProcedureModal(): NewProcedureModal {
    if (!this.newProcedureModal) {
      this.newProcedureModal = new NewProcedureModal(this.page);
    }
    return this.newProcedureModal;
  }
  /**
   * Alias for the view procedure modal; the view dialog shares
   * the same structure and locators as the new procedure modal.
   */
  getViewProcedureModal(): NewProcedureModal {
    return this.getNewProcedureModal();
  }
  getRecordedProcedureCount(): Promise<number> {

    return this.tableBody.locator('tr').count();
  }

  /**
   * Get table cell content by row and column index
   * @param rowIndex - The row index (0-based)
   * @param columnIndex - The column index (0-based)
   */
  getTableCell(rowIndex: number, columnIndex: number) {
    return this.tableBody.locator('tr').nth(rowIndex).locator('td').nth(columnIndex);
  }

  /**
   * Get the first table row
   */
  getFirstTableRow() {
    return this.tableBody.locator('tr').first();
  }

  async waitForTableToLoad(){
     await this.tableBody.waitFor({ state: 'visible' });
     await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async getNoDataFoundText() {
    return this.tableBody.locator('tr').first().locator('td').textContent();
  }
}
