import { Page } from '@playwright/test';

import { BasePage } from './BasePage';

export class SidebarPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }
}
