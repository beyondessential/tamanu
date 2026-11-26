import { Locator, Page } from '@playwright/test';
import { routes } from '@config/routes';
import { editFieldOption, selectFieldOption } from '@utils/fieldHelpers';
import { constructFacilityUrl } from '@utils/navigation';

export class ImagingRequestDetailsPage {
  readonly page: Page;
  readonly statusSelect: Locator;
  readonly completedByField: Locator;
  readonly completedByInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.statusSelect = page.getByTestId('field-mfc2-select');
    this.completedByField = page.getByTestId('field-ta7y-input');
    this.completedByInput = this.completedByField.locator('input');
  }

  async goto(patientId: string, encounterId: string, imagingRequestId: string) {
    await this.page.goto(
      constructFacilityUrl(
        `${routes.patients.all}/${patientId}/encounter/${encounterId}/imaging-request/${imagingRequestId}`,
      ),
    );
    await this.statusSelect.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  async selectStatus(status: string) {
    await selectFieldOption(this.page, this.statusSelect, { optionToSelect: status });
  }

  // Replaces Completed by with any other clinician, returning the one chosen.
  async changeCompletedBy(clinicianToReplace: string): Promise<string> {
    return (await editFieldOption(this.page, this.completedByField, {
      fieldType: 'autocompleteFieldOption',
      optionToAvoid: clinicianToReplace,
      returnOptionText: true,
    })) as string;
  }
}
