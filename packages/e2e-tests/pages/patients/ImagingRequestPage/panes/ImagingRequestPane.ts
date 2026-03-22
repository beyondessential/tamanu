import { Locator, Page } from '@playwright/test';
import { NewImagingRequestModal } from '../modals/NewImagingRequestModal';

export interface ImagingRequestRow {
  requestId: string;
  type: string;
  requestedDate: string;
  requestedBy: string;
  priority: string;
  status: string;
}

export class ImagingRequestPane {
  readonly page: Page;

  readonly printButton: Locator;
  readonly createImagingRequestButton: Locator;

  readonly table: Locator;
  readonly tableBody: Locator;
  readonly tableRows: Locator;

  readonly typeSortHeader: Locator;
  readonly requestedDateSortHeader: Locator;
  readonly requestedBySortHeader: Locator;
  readonly prioritySortHeader: Locator;
  readonly statusSortHeader: Locator;

  readonly downloadButton: Locator;
  readonly pageRecordCount: Locator;

  private newImagingRequestModal?: NewImagingRequestModal;

  constructor(page: Page) {
    this.page = page;

    this.printButton = page.getByTestId('button-21bg');
    this.createImagingRequestButton = page.getByTestId('component-enxe').filter({ hasText: 'New imaging request' });

    this.table = page.getByTestId('styledtable-1dlu');
    this.tableBody = page.getByTestId('styledtablebody-a0jz');
    this.tableRows = this.tableBody.locator('tr');

    this.typeSortHeader = page.getByTestId('tablesortlabel-0qxx-imagingType');
    this.requestedDateSortHeader = page.getByTestId('tablesortlabel-0qxx-requestedDate');
    this.requestedBySortHeader = page.getByTestId('tablesortlabel-0qxx-requestedBy.displayName');
    this.prioritySortHeader = page.getByTestId('tablesortlabel-0qxx-priority');
    this.statusSortHeader = page.getByTestId('tablesortlabel-0qxx-status');

    this.downloadButton = page.getByTestId('download-data-button');
    this.pageRecordCount = page.getByTestId('pagerecordcount-m8ne');
  }

  async waitForPageToLoad(): Promise<void> {
    await this.table.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  getNewImagingRequestModal(): NewImagingRequestModal {
    if (!this.newImagingRequestModal) {
      this.newImagingRequestModal = new NewImagingRequestModal(this.page);
    }
    return this.newImagingRequestModal;
  }
}
