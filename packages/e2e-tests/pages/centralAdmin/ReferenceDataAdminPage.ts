import { Page } from '@playwright/test';

import { ImportExportAdminPage } from './ImportExportAdminPage';

export class ReferenceDataAdminPage extends ImportExportAdminPage {
  constructor(page: Page) {
    super(page, '/admin/referenceData');
  }
}
