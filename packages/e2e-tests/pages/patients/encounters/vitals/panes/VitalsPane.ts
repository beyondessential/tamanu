import { Locator, Page, expect } from '@playwright/test';
import { BasePatientPage } from '../../../BasePatientPage';
import { RecordVitalsModal } from '../modals/RecordVitalsModal';
import { Vitals } from '../../../../../types/vitals/Vitals';
import { format } from 'date-fns';
import { EditVitalModal } from '../modals/EditVitalModal';   

const FIELD_ROWS = {
  height: '0', weight: '1', BMI: '2', SBP: '3', DBP: '4', MAP: '5',
  heartRate: '6', respiratoryRate: '7', temperature: '8', spo2: '9',
  spo2Oxygen: '10', AVPU: '11', TEW: '12', GCS: '13', painScale: '14',
  capillaryRefillTime: '15', randomBGL: '16', fastingBGL: '17',
  ventilatorLitresPerMinute: '18', ventilatorMode: '19', FIO2: '20',
  PIP: '21', PEEP: '22', Rate: '23', iTime: '24', tVolume: '25',
  mVLitresPerMinute: '26'
};

export class VitalsPane extends BasePatientPage {
  recordVitalsModal?: RecordVitalsModal;
  editVitalModal?: EditVitalModal;
  encounterId?: string;
  readonly recordVitalsButton: Locator;
  readonly dateColumnHeaderPrefix: string;
  readonly tableCellPrefix: string;
  readonly editVitalContainer: string;
  constructor(page: Page) {
    super(page);
    this.recordVitalsButton = this.page.getByTestId('button-mk5r');
    this.dateColumnHeaderPrefix = 'tablelabel-0eff-';
    this.tableCellPrefix = 'styledtablecell-2gyy-';
    this.editVitalContainer = 'cellcontainer-4zzh';
  }

  async clickRecordVitalsButton() {
    await this.recordVitalsButton.click();
    if (!this.recordVitalsModal) {
      this.recordVitalsModal = new RecordVitalsModal(this.page);
    }
    return this.recordVitalsModal;
  }

  async assertVitals(vitals: Vitals) {
    const {
      date,
      locatorKey,
      height,
      weight,
      SBP,
      DBP,
      BMI,
      MAP,
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
      mVLitresPerMinute,
    } = vitals;

    const fieldValues = {
      height: this.appendUnit(height, 'cm'),
      weight: this.appendUnit(weight, 'kg'),
      BMI: this.roundToOneDecimalPlace(BMI),
      SBP: SBP,
      DBP: DBP,
      MAP: this.roundMAPValue(MAP),
      heartRate: heartRate,
      respiratoryRate: respiratoryRate,
      temperature: this.appendUnit(this.roundToOneDecimalPlace(temperature), '°C'),
      spo2: this.appendUnit(spo2, '%'),
      spo2Oxygen: this.appendUnit(spo2Oxygen, '%'),
      AVPU: AVPU,
      TEW: TEW,
      GCS: GCS,
      painScale: painScale,
      capillaryRefillTime: capillaryRefillTime,
      randomBGL: randomBGL,
      fastingBGL: fastingBGL,
      ventilatorLitresPerMinute: ventilatorLitresPerMinute,
      ventilatorMode: ventilatorMode,
      FIO2: this.appendUnit(FIO2, '%'),
      PIP: PIP,
      PEEP: PEEP,
      Rate: Rate,
      iTime: iTime,
      tVolume: tVolume,
      mVLitresPerMinute: mVLitresPerMinute,
    };

    if (!date || !locatorKey) {
      throw new Error('Date and locator key are required to assert vitals');
    }

    //Assert the date in the column header is correct
    const formattedDate = format(new Date(date), 'MM/dd/yyh:mm a');
    const dateLocator = this.page.getByTestId(`${this.dateColumnHeaderPrefix}${locatorKey}`);
    await expect(dateLocator).toContainText(formattedDate);

    //Assert the values in the vitals table match what was recorded
    for (const [field, value] of Object.entries(fieldValues)) {
      const row = FIELD_ROWS[field as keyof typeof FIELD_ROWS];
      const cellLocator = this.page.getByTestId(`${this.tableCellPrefix}${row}-${locatorKey}`);
      if (value) {
        await expect(cellLocator).toContainText(value);
      } else if (value === undefined) {
        await expect(cellLocator).toContainText('—');
      }
    }

    return {
      date,
      locatorKey,
      ...fieldValues
    };
  }

  /**
   * Rounds the MAP value to the nearest integer - this matches is how it's displayed in the vitals table
   * @param MAP - The MAP value to round
   * @returns The rounded MAP value. Returns the original value if it's undefined or NaN.
   */
  roundMAPValue(MAP: string | undefined) {
    const numberMAP = Number(MAP);
    if (MAP !== undefined && !isNaN(numberMAP)) {
      return Math.round(numberMAP).toString();
    }
    return MAP;
  }

  /**
   * Rounds the value to the nearest 0.1 decimal place - this matches is how it's displayed in the vitals table
   * @param value - The value to round
   * @returns The rounded value. Returns the original value if it's undefined or NaN.
   */
  roundToOneDecimalPlace(value: string | undefined) {
    const numberValue = Number(value);
    if (value !== undefined && !isNaN(numberValue)) {
      return (Math.round(numberValue * 10) / 10).toFixed(1);
    }
    return value;
  }

  /**
   * Appends a unit to the value
   * @param value - The value to append the unit to
   * @param unit - The unit to append
   * @returns The value with the unit appended. Returns the original value if it's undefined.
   */
  appendUnit(value: string | undefined, unit: string) {
    if (value !== undefined) {
      return value + unit;
    }
    return value;
  }

  //TODO: update types for vitals
  async editVitals(recordedVitals: { locatorKey: string }, specificEdits: Partial<Vitals>) {
    const edits = Object.entries(specificEdits).filter(([, value]) => value !== undefined);
    
    for (const [editField, editValue] of edits) {
      const { locatorKey } = recordedVitals;
      const row = FIELD_ROWS[editField as keyof typeof FIELD_ROWS];
      const cellLocator = `${row}-${locatorKey}`;
      await this.editSpecificVital(cellLocator, editValue);
    }
  }

  async editSpecificVital(cellLocator: string, editValue: string) {
    const vitalToEdit = this.page.getByTestId(`${this.tableCellPrefix}${cellLocator}`).getByTestId(this.editVitalContainer);
    await vitalToEdit.click();
    if (!this.editVitalModal) {
      this.editVitalModal = new EditVitalModal(this.page);
    }
    //TODO: call an editVital function which is written  the editvitalmodal pom?
    await this.editVitalModal.editVital(editValue);
  }
}
