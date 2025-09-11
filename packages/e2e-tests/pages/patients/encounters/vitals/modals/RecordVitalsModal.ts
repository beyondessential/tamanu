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

  constructor(page: Page) {
    super(page);
    this.modalHeading = this.page.getByTestId('modaltitle-ojhf');
    this.confirmButton = this.page.getByTestId('formsubmitcancelrow-vzf5-confirmButton');
    this.heightField = this.page.locator('input[name="pde-PatientVitalsHeight"]');
    this.dateField = this.page.locator('input[type="datetime-local"]');
    this.weightField = this.page.locator('input[name="pde-PatientVitalsWeight"]');
    this.BMIField = this.page.locator('input[name="pde-PatientVitalsBMI"]');
}

async recordVitals(api: APIRequestContext, encounterId: string, fields: Vitals) {

    const { date, height, weight  } = fields;
    
    let BMI: string | undefined;

    if (date) {
        await this.dateField.fill(date);
    }

    const dateFieldValue = await this.dateField.evaluate((el: HTMLInputElement) => el.value);

    if (height) {
    await this.heightField.fill(height);
    }

    if (weight) {
        await this.weightField.fill(weight);
    }
    if (height && weight) {
        BMI = await this.BMIField.evaluate((el: HTMLInputElement) => el.value);
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
        BMI: BMI,
    };
}
}

