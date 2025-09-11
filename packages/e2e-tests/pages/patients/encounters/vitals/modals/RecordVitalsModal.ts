import { Locator, Page } from '@playwright/test';

import { BasePatientModal } from '../../../PatientDetailsPage/modals/BasePatientModal';
import { Vitals } from '../../../../../types/vitals/Vitals';

export class RecordVitalsModal extends BasePatientModal {
  readonly modalHeading: Locator;
  readonly heightField: Locator;
  readonly confirmButton: Locator;
  readonly dateField: Locator;

  constructor(page: Page) {
    super(page);
    this.modalHeading = this.page.getByTestId('modaltitle-ojhf');
    this.confirmButton = this.page.getByTestId('formsubmitcancelrow-vzf5-confirmButton');
    this.heightField = this.page.locator('input[name="pde-PatientVitalsHeight"]');
    this.dateField = this.page.locator('input[type="datetime-local"]');
}

async recordVitals(fields: Vitals) {
    if (fields.date) {
        await this.dateField.fill(fields.date);
    }

    const dateFieldValue = await this.dateField.evaluate((el: HTMLInputElement) => el.value);

    if (fields.height) {
    await this.heightField.fill(fields.height);
    }

    await this.confirmButton.click();

    return {
        date: dateFieldValue,
        height: fields.height,
    };
}
}

