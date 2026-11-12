import { Locator, Page } from '@playwright/test';

import { constructAdminUrl } from '../../utils/navigation';

/** An admin panel view built on ImportExportView: Import and Export tabs with data type checkboxes */
export class ImportExportAdminPage {
  readonly page: Page;
  readonly path: string;
  readonly importTab: Locator;
  readonly exportTab: Locator;
  readonly selectAllCheckbox: Locator;
  readonly downloadSuccessToast: Locator;

  constructor(page: Page, path: string) {
    this.page = page;
    this.path = path;
    this.importTab = page.getByTestId('tab-import');
    this.exportTab = page.getByTestId('tab-export');
    this.selectAllCheckbox = page.getByTestId('checkinput-21pv-controlcheck');
    this.downloadSuccessToast = page.getByText('Successfully downloaded file');
  }

  async goto() {
    await this.page.goto(constructAdminUrl(this.path));
  }

  dataTypeCheckbox(dataType: string): Locator {
    return this.page.getByTestId(`checkinput-67l8-${dataType}-controlcheck`);
  }
}
