import { APIRequestContext, Locator, Page } from '@playwright/test';

import { BasePatientModal } from '../../../PatientDetailsPage/modals/BasePatientModal';
import { Vitals } from '../../../../../types/vitals/Vitals';
import { getVitalsRecordedDates } from '@utils/apiHelpers';

export class RecordVitalsModal extends BasePatientModal {
  readonly modalHeading: Locator;
  readonly heightField: Locator;
  readonly confirmButton: Locator;
  readonly dateField: Locator;
  readonly weightField: Locator;
  readonly BMIField: Locator;
  readonly SBPField: Locator;
  readonly DBPField: Locator;
  readonly MAPField: Locator;
  readonly heartRateField: Locator;
  readonly respiratoryRateField: Locator;
  readonly temperatureField: Locator;
  readonly spo2Field: Locator;
  readonly spo2OxygenField: Locator;
  readonly AVPUField: Locator;
  readonly TEWField: Locator;
  readonly GCSField: Locator;
  readonly painScaleField: Locator;
  readonly capillaryRefillTimeField: Locator;
  readonly randomBGLField: Locator;
  readonly fastingBGLField: Locator;
  readonly ventilatorLitresPerMinuteField: Locator;
  readonly ventilatorModeField: Locator;
  readonly FIO2Field: Locator;
  readonly PIPField: Locator;
  readonly PEEPField: Locator;
  readonly RateField: Locator;
  readonly iTimeField: Locator;
  readonly tVolumeField: Locator;
  readonly mVLitresPerMinuteField: Locator;

  constructor(page: Page) {
    super(page);
    this.modalHeading = this.page.getByTestId('modaltitle-ojhf');
    this.confirmButton = this.page.getByTestId('formsubmitcancelrow-vzf5-confirmButton');
    this.heightField = this.page.locator('input[name="pde-PatientVitalsHeight"]');
    this.dateField = this.page.locator('input[type="datetime-local"]');
    this.weightField = this.page.locator('input[name="pde-PatientVitalsWeight"]');
    this.BMIField = this.page.locator('input[name="pde-PatientVitalsBMI"]');
    this.SBPField = this.page.locator('input[name="pde-PatientVitalsSBP"]');
    this.DBPField = this.page.locator('input[name="pde-PatientVitalsDBP"]');
    this.MAPField = this.page.locator('input[name="pde-PatientVitalsMAP"]');
    this.heartRateField = this.page.locator('input[name="pde-PatientVitalsHeartRate"]');
    this.respiratoryRateField = this.page.locator('input[name="pde-PatientVitalsRespiratoryRate"]');
    this.temperatureField = this.page.locator('input[name="pde-PatientVitalsTemperature"]');
    this.spo2Field = this.page.locator('input[name="pde-PatientVitalsSPO2"]');
    this.spo2OxygenField = this.page.locator('input[name="pde-PatientVitalsSPO2onOxygen"]');
    //TODO: add locator for dropdown below
    this.AVPUField = this.page.locator('TODO');
    this.TEWField = this.page.locator('input[name="pde-PatientVitalsTEWScore"]');
    this.GCSField = this.page.locator('input[name="pde-PatientVitalsGCS"]');
    this.painScaleField = this.page.locator('input[name="pde-PatientVitalsPainScale"]');
    this.capillaryRefillTimeField = this.page.locator('input[name="pde-PatientVitalsCapillaryRefillTime"]');
    this.randomBGLField = this.page.locator('input[name="pde-PatientVitalsRandomBGL"]');
    this.fastingBGLField = this.page.locator('input[name="pde-PatientVitalsFastingBGL"]');
    this.ventilatorLitresPerMinuteField = this.page.locator('input[name="pde-PatientVitalsVent"]');
    //TODO: add locator for dropdown below
    this.ventilatorModeField = this.page.locator('TODO');
    this.FIO2Field = this.page.locator('input[name="pde-PatientVitalsFiO2"]');
    this.PIPField = this.page.locator('input[name="pde-PatientVitalsPIP"]');
    this.PEEPField = this.page.locator('input[name="pde-PatientVitalsPEEP"]');
    this.RateField = this.page.locator('input[name="pde-PatientVitalsRate"]');
    this.iTimeField = this.page.locator('input[name="pde-PatientVitalsltime"]');
    this.tVolumeField = this.page.locator('input[name="pde-PatientVitalsTVol"]');
    this.mVLitresPerMinuteField = this.page.locator('input[name="pde-PatientVitalsMV"]');
    }

async recordVitals(api: APIRequestContext, encounterId: string, fields: Vitals) {

    const { 
        date, 
        height, 
        weight, 
        SBP, 
        DBP, 
        heartRate, 
        respiratoryRate, 
        temperature, 
        spo2, 
        spo2Oxygen,
        AVPU,
        TEW, 
        GCS, 
        painScale, 
        capillaryRefillTime, 
        randomBGL, 
        fastingBGL, 
        ventilatorLitresPerMinute, 
        ventilatorMode,
        FIO2, 
        PIP, 
        PEEP, 
        Rate, 
        iTime, 
        tVolume, 
        mVLitresPerMinute 
    } = fields;

    const fieldMappings = [
        { value: date, locator: this.dateField },
        { value: height, locator: this.heightField },
        { value: weight, locator: this.weightField },
        { value: SBP, locator: this.SBPField },
        { value: DBP, locator: this.DBPField },
        { value: heartRate, locator: this.heartRateField },
        { value: respiratoryRate, locator: this.respiratoryRateField },
        { value: temperature, locator: this.temperatureField },
        { value: spo2, locator: this.spo2Field },
        { value: spo2Oxygen, locator: this.spo2OxygenField },
        { value: AVPU, locator: this.AVPUField },
        { value: TEW, locator: this.TEWField },
        { value: GCS, locator: this.GCSField },
        { value: painScale, locator: this.painScaleField },
        { value: capillaryRefillTime, locator: this.capillaryRefillTimeField },
        { value: randomBGL, locator: this.randomBGLField },
        { value: fastingBGL, locator: this.fastingBGLField },
        { value: ventilatorLitresPerMinute, locator: this.ventilatorLitresPerMinuteField },
        { value: ventilatorMode, locator: this.ventilatorModeField },
        { value: FIO2, locator: this.FIO2Field },
        { value: PIP, locator: this.PIPField },
        { value: PEEP, locator: this.PEEPField },
        { value: Rate, locator: this.RateField },
        { value: iTime, locator: this.iTimeField },
        { value: tVolume, locator: this.tVolumeField },
        { value: mVLitresPerMinute, locator: this.mVLitresPerMinuteField },
      ];

    // Fill fields if values are provided
    for (const { value, locator } of fieldMappings) {
        if (value) {
        await locator.fill(value);
        }
    }

    // Read date value after fields are filled so the default will be used if no date was provided
    const dateFieldValue = await this.dateField.evaluate((el: HTMLInputElement) => el.value);

    // Calculate BMI if both height and weight are provided
    let calculatedBMI: string | undefined;
    if (height && weight) {
        calculatedBMI = await this.BMIField.evaluate((el: HTMLInputElement) => el.value);
    }

    // Calculate MAP if SBP and DBP are provided
    let calculatedMAP: string | undefined;
    if (SBP && DBP) {
        calculatedMAP = await this.MAPField.evaluate((el: HTMLInputElement) => el.value);
    }

    await this.confirmButton.click();

    //Return all the vitals associated with the encounter - the most recent one will be the vital we just recorded
    await this.page.waitForTimeout(100);
    const locatorKeys = await getVitalsRecordedDates(api, encounterId);
    const locatorKey = locatorKeys[locatorKeys.length - 1];

    return {
        date: dateFieldValue,
        locatorKey: locatorKey,
        height: height,
        weight: weight,
        SBP: SBP, 
        DBP: DBP, 
        BMI: calculatedBMI,
        MAP: calculatedMAP,
        heartRate: heartRate,
        respiratoryRate: respiratoryRate,
        temperature: temperature,
        spo2: spo2,
        spo2Oxygen: spo2Oxygen,
        AVPU: AVPU,
        TEW: TEW,
        GCS: GCS,
        painScale: painScale,
        capillaryRefillTime: capillaryRefillTime,
        randomBGL: randomBGL,
        fastingBGL: fastingBGL,
        ventilatorLitresPerMinute: ventilatorLitresPerMinute,
        ventilatorMode: ventilatorMode,
        FIO2: FIO2,
        PIP: PIP,
        PEEP: PEEP,
        Rate: Rate,
        iTime: iTime,
        tVolume: tVolume,
        mVLitresPerMinute: mVLitresPerMinute,
    };
}
}
