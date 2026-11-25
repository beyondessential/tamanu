import { BasePage } from '../BasePage';
import { constructPatientPortalUrl } from '../../utils/navigation';

/** A page of the patient portal, which is served apart from the facility frontend. */
export class PatientPortalBasePage extends BasePage {
  async goto() {
    if (!this.url) {
      throw new Error('Base URL is not defined');
    }

    await this.page.goto(constructPatientPortalUrl(this.url));
  }

  async navigateTo(url: string) {
    await this.page.goto(constructPatientPortalUrl(url));
  }
}
