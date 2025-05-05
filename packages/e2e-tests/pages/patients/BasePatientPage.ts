import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';

export class BasePatientPage extends BasePage {
  constructor(page: Page, url?: string) {
    super(page, url);
  }
}
