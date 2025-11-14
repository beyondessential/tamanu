import { Page, Locator } from '@playwright/test';                  

export class RecordVitalsModal {
  readonly page: Page;

  readonly modalTitle!: Locator;
  readonly closeButton!: Locator;
  readonly submitButton!: Locator;

  readonly dateInput!: Locator;
  readonly sbpInput!: Locator;
  readonly dbpInput!: Locator;
  readonly heartRateInput!: Locator;
  readonly respiratoryRateInput!: Locator;
  readonly temperatureInput!: Locator;
  readonly heightInput!: Locator;
  readonly weightInput!: Locator;
  readonly bmiInput!: Locator;
  readonly mapInput!: Locator;
  readonly spo2Input!: Locator;
  readonly spo2OnOxygenInput!: Locator;
  readonly avpuInput!: Locator;
  readonly tewScoreInput!: Locator;
  readonly gcsInput!: Locator;
  readonly painScaleInput!: Locator;
  readonly capillaryRefillTimeInput!: Locator;
  readonly randomBglInput!: Locator;
  readonly fastingBglInput!: Locator;
  readonly ventilatorFlowInput!: Locator;
  readonly ventilatorModeInput!: Locator;
  readonly fio2Input!: Locator;
  readonly pipInput!: Locator;
  readonly peepInput!: Locator;
  readonly rateInput!: Locator;
  readonly inspiratoryTimeInput!: Locator;
  readonly tidalVolumeInput!: Locator;
  readonly minuteVentilationInput!: Locator;

  constructor(page: Page) {
    this.page = page;

    const testIds = {
      modalTitle: 'verticalcenteredtext-ni4s',
      closeButton: 'iconbutton-eull',
      submitButton: 'formsubmitcancelrow-vzf5-confirmButton',
    } as const;

    for (const [key, id] of Object.entries(testIds)) {
      (this as any)[key] = page.getByTestId(id);
    }

    // Inputs (by name attributes or specific selectors from provided HTML)
    this.dateInput = page.locator('input[type="datetime-local"]');
    this.sbpInput = page.locator('input[name="pde-PatientVitalsSBP"]');
    this.dbpInput = page.locator('input[name="pde-PatientVitalsDBP"]');
    this.heartRateInput = page.locator('input[name="pde-PatientVitalsHeartRate"]');
    this.respiratoryRateInput = page.locator('input[name="pde-PatientVitalsRespiratoryRate"]');
    this.temperatureInput = page.locator('input[name="pde-PatientVitalsTemperature"]');
    this.heightInput = page.locator('input[name="pde-PatientVitalsHeight"]');
    this.weightInput = page.locator('input[name="pde-PatientVitalsWeight"]');
    this.bmiInput = page.locator('input[name="pde-PatientVitalsBMI"]');
    this.mapInput = page.locator('input[name="pde-PatientVitalsMAP"]');
    this.spo2Input = page.locator('input[name="pde-PatientVitalsSPO2"]');
    this.spo2OnOxygenInput = page.locator('input[name="pde-PatientVitalsSPO2onOxygen"]');
    this.avpuInput = page.locator('#react-select-11-input');
    this.tewScoreInput = page.locator('input[name="pde-PatientVitalsTEWScore"]');
    this.gcsInput = page.locator('input[name="pde-PatientVitalsGCS"]');
    this.painScaleInput = page.locator('input[name="pde-PatientVitalsPainScale"]');
    this.capillaryRefillTimeInput = page.locator('input[name="pde-PatientVitalsCapillaryRefillTime"]');
    this.randomBglInput = page.locator('input[name="pde-PatientVitalsRandomBGL"]');
    this.fastingBglInput = page.locator('input[name="pde-PatientVitalsFastingBGL"]');
    this.ventilatorFlowInput = page.locator('input[name="pde-PatientVitalsVent"]');
    this.ventilatorModeInput = page.locator('#react-select-12-input');
    this.fio2Input = page.locator('input[name="pde-PatientVitalsFiO2"]');
    this.pipInput = page.locator('input[name="pde-PatientVitalsPIP"]');
    this.peepInput = page.locator('input[name="pde-PatientVitalsPEEP"]');
    this.rateInput = page.locator('input[name="pde-PatientVitalsRate"]');
    this.inspiratoryTimeInput = page.locator('input[name="pde-PatientVitalsltime"]');
    this.tidalVolumeInput = page.locator('input[name="pde-PatientVitalsTVol"]');
    this.minuteVentilationInput = page.locator('input[name="pde-PatientVitalsMV"]');
  }

  async waitForModalToLoad() {
    await this.modalTitle.getByText('Record vitals').waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async fillVitalsForm(values: Record<string, string>) {
    if (values.heightCm) await this.heightInput.fill(values.heightCm);
    if (values.weightKg) await this.weightInput.fill(values.weightKg);
    if (values.sbp) await this.sbpInput.fill(values.sbp);
    if (values.dbp) await this.dbpInput.fill(values.dbp);  
    if (values.heartRate) await this.heartRateInput.fill(values.heartRate);
    if (values.respiratoryRate) await this.respiratoryRateInput.fill(values.respiratoryRate);
    if (values.temperature) await this.temperatureInput.fill(values.temperature);
    if (values.spo2) await this.spo2Input.fill(values.spo2);
    if (values.spo2OnOxygen) await this.spo2OnOxygenInput.fill(values.spo2OnOxygen);
    if (values.tewScore) await this.tewScoreInput.fill(values.tewScore);
    if (values.gcs) await this.gcsInput.fill(values.gcs);
    if (values.painScale) await this.painScaleInput.fill(values.painScale);
    if (values.capillaryRefillTime) await this.capillaryRefillTimeInput.fill(values.capillaryRefillTime);
    if (values.randomBgl) await this.randomBglInput.fill(values.randomBgl);
    if (values.fastingBgl) await this.fastingBglInput.fill(values.fastingBgl);
    if (values.ventilatorFlow) await this.ventilatorFlowInput.fill(values.ventilatorFlow);
    if (values.fio2) await this.fio2Input.fill(values.fio2);
    if (values.pip) await this.pipInput.fill(values.pip);
    if (values.peep) await this.peepInput.fill(values.peep);
    if (values.rate) await this.rateInput.fill(values.rate);
    if (values.inspiratoryTime) await this.inspiratoryTimeInput.fill(values.inspiratoryTime);
    if (values.tidalVolume) await this.tidalVolumeInput.fill(values.tidalVolume);
    if (values.minuteVentilation) await this.minuteVentilationInput.fill(values.minuteVentilation);
  }
}


