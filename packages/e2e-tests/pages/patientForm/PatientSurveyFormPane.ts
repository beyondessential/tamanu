import { Locator, Page } from '@playwright/test';

/**
 * A form a patient fills in themselves, page by page: the shared patient form that both the self
 * check-in kiosk and the patient portal show. Questions are found by their text.
 */
export class PatientSurveyFormPane {
  readonly page: Page;
  readonly pageProgress: Locator;
  readonly backButton: Locator;
  readonly nextButton: Locator;
  readonly submitButton: Locator;
  readonly requiredMessages: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageProgress = page.getByText(/^Page \d+ of \d+$/);
    this.backButton = page.getByRole('button', { name: 'Back', exact: true });
    this.nextButton = page.getByRole('button', { name: 'Next', exact: true });
    this.submitButton = page.getByRole('button', { name: 'Submit', exact: true });
    this.requiredMessages = page.getByText('This question is required');
  }

  question(questionText: string) {
    return this.page.locator('[data-question-id]').filter({ hasText: questionText });
  }

  async answerText(questionText: string, answer: string) {
    await this.question(questionText).getByLabel(questionText).fill(answer);
  }

  async answerYesNo(questionText: string, answer: 'Yes' | 'No') {
    await this.question(questionText).getByRole('radio', { name: answer, exact: true }).click();
  }
}
