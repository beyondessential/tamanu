import { test, expect } from '@fixtures/baseFixture';
import {
  createClinicEncounterViaApi,
  createHospitalAdmissionEncounterViaAPI,
  createTriageEncounterViaApi,
} from '@utils/apiHelpers';
import { getItemFromLocalStorage } from '@utils/localStorage';

test.setTimeout(60000);

// A ward bed priced with a bed-fee product on the facility catch-all price list ($200/night).
const PRICED_BED_LOCATION_ID = 'location-Ward1Bed1-tamanu';

// Guards the invoicing DISPLAY layer: auto-added fees must render as invoice item lines on the
// encounter's Invoicing tab. This is where both invoicing bugs surfaced (missing fee reference
// data, and the bed-fee product's Location source not being loaded into the invoice response).
test.describe('Invoicing — automatic fee display', () => {
  test('clinic encounter shows an encounter fee line on the invoice', async ({
    api,
    page,
    newPatient,
    patientDetailsPage,
  }) => {
    await createClinicEncounterViaApi(api, page, newPatient.id);

    await patientDetailsPage.goToPatient(newPatient);
    const invoice = await patientDetailsPage.navigateToInvoicingTab();

    // The clinic fee bucket (standard / after-hours / weekend) depends on the encounter start time,
    // so match on the shared label rather than a single bucket, and confirm a total renders.
    await invoice.expectItemVisible(/encounter fee/i);
    await expect(invoice.invoiceTotal).toBeVisible();
  });

  test('emergency (triage) encounter shows the ED fee line', async ({
    api,
    page,
    newPatient,
    patientDetailsPage,
  }) => {
    await createTriageEncounterViaApi(api, page, newPatient.id);

    await patientDetailsPage.goToPatient(newPatient);
    const invoice = await patientDetailsPage.navigateToInvoicingTab();

    await invoice.expectItemVisible('Emergency department fee');
  });

  test('admission to a priced bed shows the bed fee line', async ({
    api,
    page,
    newPatient,
    patientDetailsPage,
  }) => {
    // The admission helper is shared with non-invoicing specs and doesn't send facilityId itself;
    // pass it via overrides so the invoice (and its bed fee) is created for this encounter.
    const facilityId = await getItemFromLocalStorage(page, 'facilityId');
    await createHospitalAdmissionEncounterViaAPI(api, newPatient.id, {
      facilityId,
      locationId: PRICED_BED_LOCATION_ID,
    });

    await patientDetailsPage.goToPatient(newPatient);
    const invoice = await patientDetailsPage.navigateToInvoicingTab();

    // Directly guards the fixed bug: the bed-fee product's Location source was not loaded, so the
    // line rendered with no name. It must now show its product name.
    await invoice.expectItemVisible(/bed fee/i);
  });
});

// Guards the time-of-day bucketing end-to-end: the encounter start time must resolve to the correct
// clinic/ED fee product (standard / after-hours / weekend) and render that exact product on the
// invoice. Start times are pinned to fixed dates so the bucket is deterministic regardless of when
// CI runs — the e2e stack's primary timezone is Pacific/Auckland, in which 2026-06-15 is a Monday
// and 2026-06-13 a Saturday. The clinic route derives the encounter start from startDate; the triage
// model derives it from triageTime, so each path is driven by the field it actually reads.
test.describe('Invoicing — encounter fee time-of-day buckets', () => {
  const WEEKDAY_IN_HOURS = '2026-06-15 10:00:00'; // Monday, within standard hours
  const WEEKDAY_AFTER_HOURS = '2026-06-15 20:00:00'; // Monday, after standard hours
  const WEEKEND = '2026-06-13 11:00:00'; // Saturday

  test('clinic in standard hours shows the standard encounter fee', async ({
    api,
    page,
    newPatient,
    patientDetailsPage,
  }) => {
    await createClinicEncounterViaApi(api, page, newPatient.id, { startDate: WEEKDAY_IN_HOURS });

    await patientDetailsPage.goToPatient(newPatient);
    const invoice = await patientDetailsPage.navigateToInvoicingTab();

    await invoice.expectItemVisible(/standard hours encounter fee/i);
  });

  test('clinic after hours shows the after-hours encounter fee', async ({
    api,
    page,
    newPatient,
    patientDetailsPage,
  }) => {
    await createClinicEncounterViaApi(api, page, newPatient.id, { startDate: WEEKDAY_AFTER_HOURS });

    await patientDetailsPage.goToPatient(newPatient);
    const invoice = await patientDetailsPage.navigateToInvoicingTab();

    await invoice.expectItemVisible(/after hours encounter fee/i);
  });

  test('clinic on the weekend shows the weekend encounter fee', async ({
    api,
    page,
    newPatient,
    patientDetailsPage,
  }) => {
    await createClinicEncounterViaApi(api, page, newPatient.id, { startDate: WEEKEND });

    await patientDetailsPage.goToPatient(newPatient);
    const invoice = await patientDetailsPage.navigateToInvoicingTab();

    await invoice.expectItemVisible(/weekend encounter fee/i);
  });

  test('emergency after hours shows the after-hours ED fee', async ({
    api,
    page,
    newPatient,
    patientDetailsPage,
  }) => {
    await createTriageEncounterViaApi(api, page, newPatient.id, {
      startDate: WEEKDAY_AFTER_HOURS,
      triageTime: WEEKDAY_AFTER_HOURS,
    });

    await patientDetailsPage.goToPatient(newPatient);
    const invoice = await patientDetailsPage.navigateToInvoicingTab();

    await invoice.expectItemVisible(/emergency department fee \(after hours\)/i);
  });

  test('emergency on the weekend shows the weekend ED fee', async ({
    api,
    page,
    newPatient,
    patientDetailsPage,
  }) => {
    await createTriageEncounterViaApi(api, page, newPatient.id, {
      startDate: WEEKEND,
      triageTime: WEEKEND,
    });

    await patientDetailsPage.goToPatient(newPatient);
    const invoice = await patientDetailsPage.navigateToInvoicingTab();

    await invoice.expectItemVisible(/emergency department fee \(weekend\)/i);
  });
});
