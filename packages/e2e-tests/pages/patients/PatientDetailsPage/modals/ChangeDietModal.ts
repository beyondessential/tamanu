import { Locator, Page } from '@playwright/test';

export class ChangeDietModal {
  readonly page: Page;
  readonly modalTitle!: Locator;
  readonly dietMultiSelectInput!: Locator;
  readonly cancelButton!: Locator;
  readonly confirmButton!: Locator;
  readonly formGrid!: Locator;


  constructor(page: Page) {
    this.page = page;

    const testIds = {
      confirmButton: 'confirmbutton-tok1',
      cancelButton: 'outlinedbutton-95wy',
      formGrid: 'formgrid-r4hj',
    } as const;

    for (const [key, testId] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(testId);
    }
    this.modalTitle = page.getByRole('dialog').getByTestId('modaltitle-ojhf');
    this.dietMultiSelectInput = page.getByTestId('formgrid-r4hj').getByTestId('multiselectinput-vf2i').nth(1);
  }

  async waitForModalToLoad(): Promise<void> {
    await this.modalTitle.waitFor({ state: 'visible' });
    await this.dietMultiSelectInput.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async changeDiet(diet: string): Promise<void> {
 await this.dietMultiSelectInput.click();
 await this.dietMultiSelectInput.getByText(diet).click();
 await this.dietMultiSelectInput.click();
 await this.confirmButton.click();
  }
}

