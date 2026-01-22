import { Locator, Page } from '@playwright/test';
import { selectFieldOption } from '@utils/fieldHelpers';

export class SelectFormPage {
  readonly page: Page;          
  readonly programSelect!: Locator;
  readonly surveySelect!: Locator;
  readonly beginSurveyButton!: Locator;
  constructor(page: Page) {
    this.page = page;

    this.programSelect = this.page.getByTestId('selectinput-5hi2-select');
    this.surveySelect = this.page.getByTestId('selectinput-4g3c-select');

    this.beginSurveyButton = this.page.getByTestId('button-qsbg');
  }

  async waitForPageToLoad(): Promise<void> {
    await this.programSelect.waitFor({ state: 'visible' });
    // Survey select may not be visible until a program is selected
    await this.beginSurveyButton.waitFor({ state: 'visible'});
    await this.page.waitForLoadState('networkidle');
  }

  async selectProgram(programName: string): Promise<string | undefined> {
    const result = await selectFieldOption(this.page, this.programSelect, {
        optionToSelect: programName,
        returnOptionText: true,
      });
    await this.page.waitForLoadState('networkidle');
    return result;
  }

  async selectSurvey(surveyName: string): Promise<void> {
    await this.surveySelect.waitFor({ state: 'visible' });
    await selectFieldOption(this.page, this.surveySelect, {
      optionToSelect: surveyName,
      returnOptionText: true,
    });
    await this.page.waitForLoadState('networkidle');
  }

  async clickBeginSurvey(): Promise<void> {
    await this.beginSurveyButton.click();
    await this.page.waitForLoadState('networkidle');
  }
}
