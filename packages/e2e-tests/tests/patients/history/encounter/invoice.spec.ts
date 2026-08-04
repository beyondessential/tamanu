import { test, expect } from '@fixtures/baseFixture';
import {
  createHospitalAdmissionEncounterViaAPI,
  dischargeEncounterViaApi,
} from '@utils/apiHelpers';
import { getItemFromLocalStorage } from '@utils/localStorage';

test.setTimeout(60000);

// A ward bed priced with a bed-fee product on the facility catch-all price list ($200/night).
const PRICED_BED_LOCATION_ID = 'location-Ward1Bed1-tamanu';

// Finalisation is the irreversible "money" action and the one invoicing UI journey with no
// coverage. The night-counting, per-location and quantity-0-cleanup logic is covered at the
// model/integration layer; this exercises the button -> confirm modal -> finalised-state journey.
test.describe('Invoicing — finalisation', () => {
  test('finalises a discharged admission invoice from the Invoicing tab', async ({
    api,
    page,
    newPatient,
    patientDetailsPage,
  }) => {
    // Arrange (API): admit to a priced bed so the invoice carries a bed-fee line, then discharge —
    // an invoice can only be finalised once its encounter has an end date.
    const facilityId = await getItemFromLocalStorage(page, 'facilityId');
    const encounter = await createHospitalAdmissionEncounterViaAPI(api, newPatient.id, {
      facilityId,
      locationId: PRICED_BED_LOCATION_ID,
    });
    await dischargeEncounterViaApi(api, encounter.id);

    // Act (UI): open the Invoicing tab, confirm the auto bed fee is present and still in progress,
    // then finalise.
    await patientDetailsPage.goToPatient(newPatient);
    const invoice = await patientDetailsPage.navigateToInvoicingTab();
    await invoice.expectItemVisible(/bed fee/i);
    await invoice.expectStatus('In progress');
    await invoice.finalise();

    // Assert (UI): the invoice is finalised, its fee line persists, and it can't be finalised again.
    await invoice.expectStatus('Finalised');
    await invoice.expectItemVisible(/bed fee/i);
    await expect(invoice.finaliseButton).toBeHidden();
  });
});
