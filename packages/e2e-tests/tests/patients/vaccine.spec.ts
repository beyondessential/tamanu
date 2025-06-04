import { test, expect } from '@fixtures/baseFixture';

test.describe('Vaccines', () => {
  test('Add a routine vaccine', async ({ newPatient, patientDetailsPage }) => {
    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.navigateToVaccineTab();
    await patientDetailsPage.patientVaccinePane?.clickRecordVaccineButton();
    expect(patientDetailsPage.patientVaccinePane?.recordVaccineModal).toBeDefined();
    await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.recordVaccine(true, 'Routine');
    await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.waitForModalToClose();
    expect(await patientDetailsPage.patientVaccinePane?.getRecordedVaccineCount()).toBe(1);
  });

  test('Add a catchup vaccine', async ({ newPatient, patientDetailsPage }) => {
    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.navigateToVaccineTab();
    await patientDetailsPage.patientVaccinePane?.clickRecordVaccineButton();
    expect(patientDetailsPage.patientVaccinePane?.recordVaccineModal).toBeDefined();
    await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.recordVaccine(true, 'Catchup');
    await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.waitForModalToClose();
    expect(await patientDetailsPage.patientVaccinePane?.getRecordedVaccineCount()).toBe(1);
  });

  test('Add a campaign vaccine', async ({ newPatient, patientDetailsPage }) => {
    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.navigateToVaccineTab();
    await patientDetailsPage.patientVaccinePane?.clickRecordVaccineButton();
    expect(patientDetailsPage.patientVaccinePane?.recordVaccineModal).toBeDefined();
    await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.recordVaccine(
      true,
      'Campaign',
    );
    await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.waitForModalToClose();
    expect(await patientDetailsPage.patientVaccinePane?.getRecordedVaccineCount()).toBe(1);
  });

  test('Add an other vaccine', async ({ newPatient, patientDetailsPage }) => {
    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.navigateToVaccineTab();
    await patientDetailsPage.patientVaccinePane?.clickRecordVaccineButton();
    expect(patientDetailsPage.patientVaccinePane?.recordVaccineModal).toBeDefined();
    await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.recordVaccine(true, 'Other');
    await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.waitForModalToClose();
    expect(await patientDetailsPage.patientVaccinePane?.getRecordedVaccineCount()).toBe(1);
  });

  test('Add multiple vaccines of different types', async ({ newPatient, patientDetailsPage }) => {
    await patientDetailsPage.goToPatient(newPatient);
    await patientDetailsPage.navigateToVaccineTab();

    // Record Routine vaccine
    await patientDetailsPage.patientVaccinePane?.clickRecordVaccineButton();
    expect(patientDetailsPage.patientVaccinePane?.recordVaccineModal).toBeDefined();
    await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.recordVaccine(true, 'Routine');
    await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.waitForModalToClose();

    // Record Catchup vaccine
    await patientDetailsPage.patientVaccinePane?.clickRecordVaccineButton();
    await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.recordVaccine(true, 'Catchup');
    await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.waitForModalToClose();

    // Record Campaign vaccine
    await patientDetailsPage.patientVaccinePane?.clickRecordVaccineButton();
    await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.recordVaccine(
      true,
      'Campaign',
    );
    await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.waitForModalToClose();

    // Record Other vaccine
    await patientDetailsPage.patientVaccinePane?.clickRecordVaccineButton();
    await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.recordVaccine(true, 'Other');
    await patientDetailsPage.patientVaccinePane?.recordVaccineModal?.waitForModalToClose();

    // Verify total count
    expect(await patientDetailsPage.patientVaccinePane?.getRecordedVaccineCount()).toBe(4);
  });
});
