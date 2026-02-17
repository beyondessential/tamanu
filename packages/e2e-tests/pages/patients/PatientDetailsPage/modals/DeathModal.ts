import { Locator, Page } from '@playwright/test';
import { selectAutocompleteFieldOption } from '@utils/fieldHelpers';

export class DeathModal {
  readonly page: Page;
  readonly deathForm!: Locator;
  readonly timeOfDeathInput!: Locator;
  readonly clinicianInput!: Locator;
  readonly causeOfDeathInput!: Locator;
  readonly saveAndCloseButton!: Locator;
  readonly cancelButton!: Locator;
  readonly continueButton!: Locator;
  readonly backButton!: Locator;
  readonly summaryScreen!: Locator;
  readonly summaryHeading!: Locator;
  readonly confirmButton!: Locator;

  constructor(page: Page) {
    this.page = page;

    const dialog = page.getByRole('dialog');
    this.deathForm = dialog.getByTestId('styledform-5o5i');
    const formContent = dialog.getByTestId('styledform-5o5i');
    this.timeOfDeathInput = formContent.getByTestId('datetimefield-8fsq');
    this.clinicianInput = formContent.getByTestId('field-j9h1').locator('input');
    this.causeOfDeathInput = formContent.getByTestId('fieldwithtooltip-gyk3').locator('input');
    this.saveAndCloseButton = formContent.getByTestId('outlinedbutton-nyjb');
    this.cancelButton = formContent.getByTestId('outlinedbutton-nsd2');
    this.continueButton = formContent.getByTestId('button-ok5z');
    this.backButton = formContent.getByTestId('outlinedbutton-mj9c');
    this.summaryScreen = page.getByRole('dialog');
    this.summaryHeading = this.summaryScreen.getByTestId('redheading-zwa4');
    this.confirmButton = this.summaryScreen.getByTestId('actions-kb95').getByTestId('box-gycr').getByTestId('button-2g84');
  }

  async waitForModalToLoad(): Promise<void> {
    await this.deathForm.waitFor({ state: 'visible'});
    await this.page.waitForLoadState('networkidle');
  }

  async waitForModalToClose(): Promise<void> {
    await this.deathForm.waitFor({ state: 'detached'});
    await this.page.waitForLoadState('networkidle');
  }

  async clickSaveAndClose(): Promise<void> {
    await this.saveAndCloseButton.click();
  }

  async clickContinue(): Promise<void> {
    await this.continueButton.click();
  }

  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async clickBack(): Promise<void> {
    await this.backButton.click();
  }

  async confirmOnSummaryScreen(): Promise<void> {
    await this.summaryScreen.waitFor({ state: 'visible'});
    await this.confirmButton.click();
  }

  private async fillAutocompleteField(
    field: Locator,
    value?: string,
  ): Promise<string | undefined> {
    if (value) {
      return await selectAutocompleteFieldOption(this.page, field, {
        optionToSelect: value,
        returnOptionText: true,
      });
    }
    return await selectAutocompleteFieldOption(this.page, field, {
      selectFirst: true,
      returnOptionText: true,
    });
  }

  async fillClinician(clinicianName?: string): Promise<string | undefined> {
    return await this.fillAutocompleteField(this.clinicianInput, clinicianName);
  }

  async fillCauseOfDeath(causeName?: string): Promise<string | undefined> {
    return await this.fillAutocompleteField(this.causeOfDeathInput, causeName);
  }
}
