import { Locator, Page, expect } from '@playwright/test';
import { BasePatientPage } from '../../../BasePatientPage';
import { RecordVitalsModal } from '../modals/RecordVitalsModal';
import { Vitals } from '../../../../../types/vitals/Vitals';
import { format } from 'date-fns';

/**
 * Mapping of vital to the row index in the vitals table
 */
const vitalsRowMapping = {
  height: '0',
  weight: '1',
  BMI: '2',
  SBP: '3',
  DBP: '4',
  MAP: '5',
  heartRate: '6',
  respiratoryRate: '7',
  temperature: '8',
  spo2: '9',
  spo2Oxygen: '10',
  AVPU: '11',
  TEW: '12',
  GCS: '13',
  painScale: '14',
  capillaryRefillTime: '15',
  randomBGL: '16',
  fastingBGL: '17',
  ventilatorLitresPerMinute: '18',
  ventilatorMode: '19',
  FIO2: '20',
  PIP: '21',
  PEEP: '22',
  Rate: '23',
  iTime: '24',
  tVolume: '25',
  mVLitresPerMinute: '26'
}

export class VitalsPane extends BasePatientPage {
  recordVitalsModal?: RecordVitalsModal;
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
    const { date, locatorKey, height } = vitals;

    //Assert the date in the column header is correct
    const formattedDate = format(new Date(date), 'MM/dd/yyh:mm a');
    const dateLocator = this.page.getByTestId(`${this.dateColumnHeaderPrefix}${locatorKey}`);
    await expect(dateLocator).toContainText(formattedDate);

   if (height) {
    await expect(this.page.getByTestId(`styledtablecell-2gyy-${vitalsRowMapping.height}-${locatorKey}`)).toContainText(height);
   }
  }
}
