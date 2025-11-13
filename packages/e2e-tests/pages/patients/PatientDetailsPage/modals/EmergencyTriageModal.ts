import { Page, Locator } from '@playwright/test';
import { selectFieldOption, selectAutocompleteFieldOption } from '@utils/fieldHelpers';
import { RecordVitalsModal } from './RecordVitalsModal';

export class EmergencyTriageModal {
  readonly page: Page;
  
  // Modal header
  readonly modalTitle!: Locator;
  readonly closeButton!: Locator;
  
  // Patient details section
  readonly patientDetailsSection!: Locator;
  readonly firstNameLabel!: Locator;
  readonly firstNameValue!: Locator;
  readonly lastNameLabel!: Locator;
  readonly lastNameValue!: Locator;
  readonly sexLabel!: Locator;
  readonly sexValue!: Locator;
  readonly dateOfBirthLabel!: Locator;
  readonly dateOfBirthValue!: Locator;
  readonly displayIdLabel!: Locator;
  
  // Form fields
  readonly form!: Locator;
  readonly arrivalDateTimeField!: Locator;
  readonly arrivalDateTimeInput!: Locator;
  readonly triageDateTimeField!: Locator;
  readonly triageDateTimeInput!: Locator;
  readonly areaField!: Locator;
  readonly locationField!: Locator;
  readonly arrivalModeSelect!: Locator;
  
  // Triage score radio buttons
  readonly triageScoreEmergency!: Locator;
  readonly triageScoreVeryUrgent!: Locator;
  readonly triageScoreUrgent!: Locator;
  readonly triageScoreNonUrgent!: Locator;
  readonly triageScoreDeceased!: Locator;
  
  // Complaint fields
  readonly chiefComplaintField!: Locator;
  readonly secondaryComplaintField!: Locator;
  
  // Buttons
  readonly recordVitalsButton!: Locator;
  readonly triageClinicianField!: Locator;
  readonly cancelButton!: Locator;
  readonly submitButton!: Locator;

  constructor(page: Page) {
    this.page = page;
    
    const testIds = {
      // Modal header
      modalTitle: 'verticalcenteredtext-ni4s',
      closeButton: 'iconbutton-eull',
      
      // Patient details section
      patientDetailsSection: 'patientdetails-pdbh',
      firstNameLabel: 'detaillabel-l4mb-firstName',
      firstNameValue: 'detailvalue-lsjb-firstName',
      lastNameLabel: 'detaillabel-l4mb-lastName',
      lastNameValue: 'detailvalue-lsjb-lastName',
      sexLabel: 'detaillabel-l4mb-sex',
      sexValue: 'detailvalue-lsjb-sex',
      dateOfBirthLabel: 'detaillabel-l4mb-dateOfBirth',
      dateOfBirthValue: 'detailvalue-lsjb-dateOfBirth',
      displayIdLabel: 'displayidlabel-upiz',
      
      // Form fields
      form: 'styledform-5o5i',
      arrivalDateTimeField: 'field-mhav',
      arrivalDateTimeInput: 'field-mhav-input',
      triageDateTimeField: 'field-9hxy',
      triageDateTimeInput: 'field-9hxy-input',
      areaField: 'field-ipih-group-input',
      locationField: 'field-ipih-location-input',
      arrivalModeSelect: 'selectinput-phtg-select',
      
      // Triage score radio buttons
      triageScoreEmergency: 'radio-il3t-1',
      triageScoreVeryUrgent: 'radio-il3t-2',
      triageScoreUrgent: 'radio-il3t-3',
      triageScoreNonUrgent: 'radio-il3t-4',
      triageScoreDeceased: 'radio-il3t-5',
      
      // Complaint fields
      chiefComplaintField: 'field-a7cu-input',
      secondaryComplaintField: 'field-1ktz-input',
      
      // Buttons
      recordVitalsButton: 'outlinedbutton-pp8c',
      triageClinicianField: 'field-388u-input',
      cancelButton: 'outlinedbutton-8rnr',
      submitButton: 'row-vpng-confirmButton',
    } as const;

    // Create locators using the testId mapping
    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }
  }

  async waitForModalToLoad() {
    await this.modalTitle.getByText('New emergency triage').waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async selectTriageScore(score: 1 | 2 | 3 | 4 | 5) {
    const scoreMap = {
      1: this.triageScoreEmergency,
      2: this.triageScoreVeryUrgent,
      3: this.triageScoreUrgent,
      4: this.triageScoreNonUrgent,
      5: this.triageScoreDeceased,
    };
    await scoreMap[score].click();
  }

  async fillTriageForm(options: {
    arrivalDateTime?: string;
    triageScore: 1 | 2 | 3 | 4 | 5;
    vitalsValues?: {
      heightCm?: string;
      weightKg?: string;
      sbp?: string;
      dbp?: string;
      heartRate?: string;
      respiratoryRate?: string;
      temperature?: string;
      spo2?: string;
      spo2OnOxygen?: string;
      tewScore?: string;
      gcs?: string;
      painScale?: string;
      capillaryRefillTime?: string;
      randomBgl?: string;
      fastingBgl?: string;
      ventilatorFlow?: string;
      ventilatorMode?: string;
      fio2?: string;
      pip?: string;
      peep?: string;
      rate?: string;
      inspiratoryTime?: string;
      tidalVolume?: string;
      minuteVentilation?: string;
    };
  }): Promise<{
    arrivalDateTime?: string;
    triageScore: 1 | 2 | 3 | 4 | 5;
    area?: string;
    location?: string;
    arrivalMode?: string;
    chiefComplaint?: string;
    secondaryComplaint?: string;
    triageClinician?: string;
  }> {
    if (options.arrivalDateTime) {
      await this.arrivalDateTimeInput.locator('input').fill(options.arrivalDateTime);
    }
    
    const area = await selectAutocompleteFieldOption(this.page, this.areaField, {
      selectFirst: true,
      returnOptionText: true,
    });
    
    const location = await selectAutocompleteFieldOption(this.page, this.locationField, {
      selectFirst: true,
      returnOptionText: true,
    });
    
    const arrivalMode = await selectFieldOption(this.page, this.arrivalModeSelect, {
      selectFirst: true,
      returnOptionText: true,
    });
    
    await this.selectTriageScore(options.triageScore);
    
    const chiefComplaint = await selectAutocompleteFieldOption(this.page, this.chiefComplaintField, {
      selectFirst: true,
      returnOptionText: true,
    });
    
    const secondaryComplaint = await selectAutocompleteFieldOption(this.page, this.secondaryComplaintField, {
      selectFirst: true,
      returnOptionText: true,
    });

    if (options.vitalsValues) {
      await this.recordVitalsButton.click();
      const recordVitalsModal = this.getRecordVitalsModal();
      await recordVitalsModal.waitForModalToLoad();
      await recordVitalsModal.fillVitalsForm(options.vitalsValues as Record<string, string>);
      await recordVitalsModal.submitButton.click();
    }

    const triageClinician = await selectAutocompleteFieldOption(this.page, this.triageClinicianField, {
      selectFirst: true,
      returnOptionText: true,
    });

    return {
      arrivalDateTime: options.arrivalDateTime,
      triageScore: options.triageScore,
      area,
      location,
      arrivalMode,
      chiefComplaint,
      secondaryComplaint,
      triageClinician,
    };
  }

  getRecordVitalsModal() {
    return new RecordVitalsModal(this.page);
  }

}

