import { subDays } from 'date-fns';

import { test, expect } from '@fixtures/baseFixture';
import { createHospitalAdmissionEncounterViaAPI, createVitalsReadingViaApi } from '@utils/apiHelpers';
import { VitalsPage } from '@pages/patients/VitalsPage/panes/VitalsPage';
import { VitalChartsModal } from '@pages/patients/VitalsPage/modals/VitalChartsModal';

const toIso9075 = (date: Date) => date.toISOString().replace('T', ' ').substring(0, 19);

test.describe('Vitals', () => {
  test('Record vitals sign (°C)', async () => {});

  test('Vitals chart shows daily ticks with weekday labels for the "Last 7 days" range', async ({
    page,
    api,
    newPatient,
    patientDetailsPage,
  }) => {
    test.setTimeout(60000);

    const encounter = await createHospitalAdmissionEncounterViaAPI(api, newPatient.id);

    const now = new Date();
    // Spread readings across more than 7 days so the seeded data resembles a
    // real patient history, not just a single point.
    await Promise.all(
      [0, 3, 10].map(daysAgo =>
        createVitalsReadingViaApi(
          api,
          page,
          encounter.id,
          newPatient.id,
          toIso9075(subDays(now, daysAgo)),
        ),
      ),
    );

    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.navigateToFirstEncounter();
    await patientDetailsPage.navigateToVitalsTab();

    const vitalsPage = new VitalsPage(page);
    await vitalsPage.waitForSectionToLoad();

    // Open the Temperature row's own chart, rather than the "Vitals" column
    // header button that opens every graphable measure at once — this is
    // the one measure seeded with data above, and opening a single chart
    // avoids the multi-chart view's much heavier parallel data fetch.
    await vitalsPage.openChartForMeasure('Temperature (°C)');

    const chartsModal = new VitalChartsModal(page);
    await chartsModal.waitForModalToLoad();

    // Sanity-check the default ("Last 24 hours") view before switching, so a
    // failure to select "Last 7 days" below doesn't read as a false pass.
    const defaultSecondaryLabels = await chartsModal.getSecondaryTickLabels();
    expect(defaultSecondaryLabels.length).toBeGreaterThan(0);
    for (const label of defaultSecondaryLabels) {
      expect(label).toMatch(/^\d{1,2}:\d{2}(am|pm)$/);
    }

    await chartsModal.selectDateRangeOption('Last 7 days');

    const weekdayLabels = await chartsModal.getSecondaryTickLabels();
    expect(weekdayLabels.length).toBeGreaterThan(0);
    for (const label of weekdayLabels) {
      expect(label).toMatch(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/);
    }
  });
});
