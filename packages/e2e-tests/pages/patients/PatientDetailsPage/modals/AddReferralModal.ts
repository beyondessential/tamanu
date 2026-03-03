import { Locator, Page } from '@playwright/test';
import { selectAutocompleteFieldOption, selectFieldOption } from '@utils/fieldHelpers';

export class AddReferralModal {
  readonly page: Page;
  readonly confirmButton!: Locator;
  readonly referralNameInput!: Locator;
  readonly referralDateInput!: Locator;
  readonly referralReasonInput!: Locator;
  readonly referralNotesInput!: Locator;
  readonly surveySelector!: Locator;
  readonly referralFormGrid!: Locator;
  readonly beginReferralButton!: Locator;
  readonly formFields!: Locator;
  readonly referralHealthFacility!: Locator;
  readonly referralCompletedBy!: Locator;
  readonly reasonForReferral!: Locator;
  readonly nextButton!: Locator;
  readonly completeReferralButton!: Locator;
  readonly relevantScreeningHistory!: Locator;
  constructor(page: Page) {
    this.page = page;

  
    this.beginReferralButton = this.page.getByTestId('row-atzb').getByTestId('button-qsbg');
    this.referralFormGrid = this.page.getByTestId('formgrid-prtu');
    this.surveySelector = this.referralFormGrid.getByTestId('selectinput-4g3c-select');
    this.formFields = this.page.getByTestId('formgrid-h378');
    this.referralDateInput = this.formFields.getByText('Referral date').locator('..').getByTestId('wrapperfieldcomponent-mkjr-input').locator('input');
    this.referralHealthFacility = this.formFields.getByText('Referring health facility').locator('..').getByTestId('autocompletefield-efuf-input');
    this.referralCompletedBy = this.formFields.getByText('Referral completed by').locator('..').getByTestId('autocompletefield-efuf-input');
    this.reasonForReferral = this.formFields.getByText('Reason for referral').locator('..').getByTestId('wrapperfieldcomponent-mkjr-input');
    this.relevantScreeningHistory= this.formFields.getByText('Relevant screening history').locator('..').getByTestId('selectinput-ra3s-input');
    this.nextButton = this.page.getByTestId('button-m3a6');
    this.completeReferralButton = this.page.getByTestId('formsubmitbutton-pufy');
    this.confirmButton = this.completeReferralButton; // Alias for backward compatibility
  }

  async waitForModalToLoad(): Promise<void> {
    await this.surveySelector.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async selectSurvey(surveyName: string): Promise<void> {
    await selectFieldOption(this.page, this.surveySelector, {
      optionToSelect: surveyName,
      returnOptionText: false,
    });
    await this.beginReferralButton.click();
    // Wait for the survey form to load after selecting
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async waitForFormFieldsToBeVisible(): Promise<void> {
    await this.formFields.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async fillCVDPrimaryScreeningForm(values: {
    referralDate: string;
    referralHealthFacility?: string;
    referralCompletedBy?: string;
    referralReason?: string;
    relevantScreeningHistory?: boolean;
  }): Promise<{
    referralDate: string;
    referralHealthFacility?: string;
    referralCompletedBy?: string;
    referralReason?: string;
    relevantScreeningHistory?: string;
  }> {
    await this.referralDateInput.fill(values.referralDate);
    
    const selectedReferralHealthFacility = values.referralHealthFacility
      ? await selectAutocompleteFieldOption(this.page, this.referralHealthFacility, {
          optionToSelect: values.referralHealthFacility,
          returnOptionText: true,
        })
      : await selectAutocompleteFieldOption(this.page, this.referralHealthFacility, {
        selectFirst: true,
        returnOptionText: true,
      });
    
    const selectedReferralCompletedBy = values.referralCompletedBy
      ? await selectAutocompleteFieldOption(this.page, this.referralCompletedBy, {
          optionToSelect: values.referralCompletedBy,
          returnOptionText: true,
        })
      : await selectAutocompleteFieldOption(this.page, this.referralCompletedBy, {
        selectFirst: true,
        returnOptionText: true,
      });
    
    let selectedRelevantScreeningHistory: string | undefined;
    if (values.relevantScreeningHistory) {
      selectedRelevantScreeningHistory = await selectFieldOption(this.page, this.relevantScreeningHistory, {
        selectFirst: true,
        returnOptionText: true,
      });
    }
    
    let selectedReferralReason: string | undefined;
    if (values.referralReason) {
      await this.reasonForReferral.fill(values.referralReason);
      selectedReferralReason = values.referralReason;
    }
    
    return {
      referralDate: values.referralDate,
      referralHealthFacility: selectedReferralHealthFacility,
      referralCompletedBy: selectedReferralCompletedBy,
      referralReason: selectedReferralReason,
      relevantScreeningHistory: selectedRelevantScreeningHistory,
    };
  }
}

