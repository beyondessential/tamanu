import { Locator, Page } from '@playwright/test';
import { BasePatientPane } from './BasePatientPane';
import { AddReferralModal } from '../modals/AddReferralModal';

export class ReferralPane extends BasePatientPane {
  readonly addReferralButton!: Locator;
  private _addReferralModal?: AddReferralModal;

  constructor(page: Page) {
    super(page);
    this.addReferralButton = this.page.getByTestId('button-u28m');
  }

  async waitForPageToLoad(): Promise<void> {
    await this.addReferralButton.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  getAddReferralModal(): AddReferralModal {
    if (!this._addReferralModal) {
      this._addReferralModal = new AddReferralModal(this.page);
    }
    return this._addReferralModal;
  }
}

