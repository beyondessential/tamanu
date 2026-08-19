import { fake } from '@tamanu/fake-data/fake';
import { FACT_CURRENT_SYNC_TICK } from '@tamanu/constants';

import { CentralSyncManager } from '../../../app/sync/CentralSyncManager';
import { mergePatient } from '../../../app/admin/patientMerge/mergePatient';
import { createTestContext } from '../../utilities';
import { makeTwoPatients } from './makeTwoPatients';

describe('Sync lookup after patient merge', () => {
  let ctx;
  let models;
  let centralSyncManager;
  let facility;
  let department;
  let location;
  let examiner;
  let medication;

  const lookupPatientIdFor = async (recordType, recordId) => {
    const row = await models.SyncLookup.findOne({ where: { recordType, recordId } });
    return row?.patientId;
  };

  const makeEncounterWithPrescription = async patientId => {
    const {
      Encounter,
      EncounterPrescription,
      MedicationAdministrationRecord,
      Prescription,
    } = models;
    const encounter = await Encounter.create(
      fake(Encounter, {
        patientId,
        departmentId: department.id,
        locationId: location.id,
        examinerId: examiner.id,
      }),
    );
    const prescription = await Prescription.create(
      fake(Prescription, { medicationId: medication.id }),
    );
    await EncounterPrescription.create(
      fake(EncounterPrescription, {
        encounterId: encounter.id,
        prescriptionId: prescription.id,
      }),
    );
    const medicationAdministrationRecord = await MedicationAdministrationRecord.create(
      fake(MedicationAdministrationRecord, {
        prescriptionId: prescription.id,
        recordedByUserId: examiner.id,
      }),
    );
    return { encounter, prescription, medicationAdministrationRecord };
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models } = ctx.store);
    centralSyncManager = new CentralSyncManager(ctx);

    const { Department, Facility, Location, ReferenceData, User } = models;
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 4);

    facility = await Facility.create(fake(Facility));
    location = await Location.create(fake(Location, { facilityId: facility.id }));
    department = await Department.create(fake(Department, { facilityId: facility.id }));
    examiner = await User.create(fake(User));
    medication = await ReferenceData.create(fake(ReferenceData, { type: 'drug' }));
  });

  afterAll(() => ctx.close());

  it('rescopes an encounter-linked prescription onto the surviving patient', async () => {
    const [keep, merge] = await makeTwoPatients(models);
    const {
      encounter,
      prescription,
      medicationAdministrationRecord,
    } = await makeEncounterWithPrescription(merge.id);

    await centralSyncManager.updateLookupTable();
    expect(await lookupPatientIdFor('encounters', encounter.id)).toBe(merge.id);
    expect(await lookupPatientIdFor('prescriptions', prescription.id)).toBe(merge.id);

    await mergePatient(models, keep.id, merge.id);
    await centralSyncManager.updateLookupTable();

    expect(await lookupPatientIdFor('encounters', encounter.id)).toBe(keep.id);
    expect(await lookupPatientIdFor('prescriptions', prescription.id)).toBe(keep.id);
    expect(
      await lookupPatientIdFor(
        'medication_administration_records',
        medicationAdministrationRecord.id,
      ),
    ).toBe(keep.id);
  });
});
