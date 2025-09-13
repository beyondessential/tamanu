import { Locator, Page, expect } from '@playwright/test';
import { BasePatientPage } from '../../../BasePatientPage';
import { RecordVitalsModal } from '../modals/RecordVitalsModal';
import { Vitals } from '../../../../../types/vitals/Vitals';
import { format } from 'date-fns';

export class VitalsPane extends BasePatientPage {
  recordVitalsModal?: RecordVitalsModal;
  encounterId?: string;
  readonly recordVitalsButton: Locator;
  readonly dateColumnHeaderPrefix: string;
  constructor(page: Page) {
    super(page);
    this.recordVitalsButton = this.page.getByTestId('button-mk5r');
    this.dateColumnHeaderPrefix = 'tablelabel-0eff-';
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

    const fieldMappings = [
      { value: this.appendUnit(height, 'cm'), row: '0' },
      { value: this.appendUnit(weight, 'kg'), row: '1' },
      { value: this.roundToOneDecimalPlace(BMI), row: '2' },
      { value: SBP, row: '3' },
      { value: DBP, row: '4' },
      { value: this.roundMAPValue(MAP), row: '5' },
      { value: heartRate, row: '6' },
      { value: respiratoryRate, row: '7' },
      { value: this.appendUnit(this.roundToOneDecimalPlace(temperature), '°C'), row: '8' },
      { value: this.appendUnit(spo2, '%'), row: '9' },
      { value: this.appendUnit(spo2Oxygen, '%'), row: '10' },
      { value: AVPU, row: '11' },
      { value: TEW, row: '12' },
      { value: GCS, row: '13' },
      { value: painScale, row: '14' },
      { value: capillaryRefillTime, row: '15' },
      { value: randomBGL, row: '16' },
      { value: fastingBGL, row: '17' },
      { value: ventilatorLitresPerMinute, row: '18' },
      { value: ventilatorMode, row: '19' },
      { value: this.appendUnit(FIO2, '%'), row: '20' },
      { value: PIP, row: '21' },
      { value: PEEP, row: '22' },
      { value: Rate, row: '23' },
      { value: iTime, row: '24' },
      { value: tVolume, row: '25' },
      { value: mVLitresPerMinute, row: '26' },
    ];

    if (!date || !locatorKey) {
      throw new Error('Date and locator key are required to assert vitals');
    }

    //Assert the date in the column header is correct
    const formattedDate = format(new Date(date), 'MM/dd/yyh:mm a');
    const dateLocator = this.page.getByTestId(`${this.dateColumnHeaderPrefix}${locatorKey}`);
    await expect(dateLocator).toContainText(formattedDate);

    //Assert the values in the vitals table match what was recorded
    for (const { value, row } of fieldMappings) {
      const cellLocator = this.page.getByTestId(`styledtablecell-2gyy-${row}-${locatorKey}`);
      if (value) {
        await expect(cellLocator).toContainText(value);
      } else if (value === undefined) {
        await expect(cellLocator).toContainText('—');
      }
    }
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
}
