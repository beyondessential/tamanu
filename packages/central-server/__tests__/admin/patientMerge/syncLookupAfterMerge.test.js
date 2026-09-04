import config from 'config';

import { fake } from '@tamanu/fake-data/fake';
import { FACT_CURRENT_SYNC_TICK } from '@tamanu/constants';

import { CentralSyncManager } from '../../../app/sync/CentralSyncManager';
import { mergePatient } from '../../../app/admin/patientMerge/mergePatient';
import { PatientMergeMaintainer } from '../../../app/tasks/PatientMergeMaintainer';
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

  const lookupRowFor = (recordType, recordId) =>
    models.SyncLookup.findOne({ where: { recordType, recordId } });

  const lookupPatientIdFor = async (recordType, recordId) => {
    const row = await lookupRowFor(recordType, recordId);
    return row?.patientId;
  };

  // One encounter carrying a record of each shape whose lookup scope derives through joins its own
  // table doesn't declare: a prescription across a belongsToMany, its MAR one hop further out, and
  // a lab request log with no association at all.
  const makeEncounterRecords = async patientId => {
    const {
      Encounter,
      EncounterPrescription,
      LabRequest,
      LabRequestLog,
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
    const encounterPrescription = await EncounterPrescription.create(
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
    const labRequest = await LabRequest.create(
      fake(LabRequest, {
        encounterId: encounter.id,
        departmentId: department.id,
        collectedById: examiner.id,
      }),
    );
    const labRequestLog = await LabRequestLog.create(
      fake(LabRequestLog, {
        status: 'reception_pending',
        labRequestId: labRequest.id,
      }),
    );

    return {
      encounter,
      encounterPrescription,
      labRequestLog,
      medicationAdministrationRecord,
      prescription,
    };
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

  it('rescopes encounter-linked records onto the surviving patient', async () => {
    const [keep, merge] = await makeTwoPatients(models);
    const records = await makeEncounterRecords(merge.id);

    const scopedRecordTypes = [
      ['encounters', records.encounter.id],
      ['encounter_prescriptions', records.encounterPrescription.id],
      ['prescriptions', records.prescription.id],
      ['medication_administration_records', records.medicationAdministrationRecord.id],
      ['lab_request_logs', records.labRequestLog.id],
    ];

    await centralSyncManager.updateLookupTable();
    for (const [recordType, recordId] of scopedRecordTypes) {
      expect([recordType, await lookupPatientIdFor(recordType, recordId)]).toEqual([
        recordType,
        merge.id,
      ]);
    }
    const tickBeforeMerge = (await lookupRowFor('prescriptions', records.prescription.id))
      .updatedAtSyncTick;

    await mergePatient(models, keep.id, merge.id);
    await centralSyncManager.updateLookupTable();

    for (const [recordType, recordId] of scopedRecordTypes) {
      expect([recordType, await lookupPatientIdFor(recordType, recordId)]).toEqual([
        recordType,
        keep.id,
      ]);
    }

    // the rescoped rows carry a fresh lookup tick, so facilities re-pull them
    const tickAfterMerge = (await lookupRowFor('prescriptions', records.prescription.id))
      .updatedAtSyncTick;
    expect(Number(tickAfterMerge)).toBeGreaterThan(Number(tickBeforeMerge));

    expect(await models.LocalSystemFact.getLookupPatientsToRebuild()).toEqual([]);
  });

  it('rescopes records that arrive for a patient already merged', async () => {
    const [keep, merge] = await makeTwoPatients(models);
    await mergePatient(models, keep.id, merge.id);

    const { prescription } = await makeEncounterRecords(merge.id);
    await centralSyncManager.updateLookupTable();
    expect(await lookupPatientIdFor('prescriptions', prescription.id)).toBe(merge.id);

    await new PatientMergeMaintainer(ctx).remergePatientRecords();
    await centralSyncManager.updateLookupTable();

    expect(await lookupPatientIdFor('prescriptions', prescription.id)).toBe(keep.id);

    // a run that repoints nothing flags nothing, so the merged patient's tombstones (which
    // legitimately keep the old id) aren't re-queued every run
    await new PatientMergeMaintainer(ctx).remergePatientRecords();
    expect(await models.LocalSystemFact.getLookupPatientsToRebuild()).toEqual([]);
  });

  it('rescopes records stranded by an earlier merge when the patient is flagged for rebuild', async () => {
    const [keep, merge] = await makeTwoPatients(models);
    await mergePatient(models, keep.id, merge.id);

    const { encounter, prescription } = await makeEncounterRecords(merge.id);
    await centralSyncManager.updateLookupTable();

    // A past run repointed the encounter but never re-queued the records scoped through it;
    // raw SQL as the maintainer does it, since the model forbids changing an encounter's patient
    await models.Encounter.sequelize.query(
      `UPDATE encounters SET patient_id = :keepId WHERE id = :encounterId`,
      { replacements: { keepId: keep.id, encounterId: encounter.id } },
    );
    await centralSyncManager.updateLookupTable();
    expect(await lookupPatientIdFor('encounters', encounter.id)).toBe(keep.id);
    expect(await lookupPatientIdFor('prescriptions', prescription.id)).toBe(merge.id);

    // as the deploy migration does for every already-merged patient
    await models.LocalSystemFact.flagLookupPatientsForRebuild([merge.id]);
    await centralSyncManager.updateLookupTable();

    expect(await lookupPatientIdFor('prescriptions', prescription.id)).toBe(keep.id);
  });

  it('leaves records alone when dependent record resync is disabled', async () => {
    const [keep, merge] = await makeTwoPatients(models);
    const { prescription } = await makeEncounterRecords(merge.id);
    await centralSyncManager.updateLookupTable();

    await mergePatient(models, keep.id, merge.id, false);
    await centralSyncManager.updateLookupTable();

    expect(await lookupPatientIdFor('prescriptions', prescription.id)).toBe(merge.id);
  });

  it('rebuilds at most the configured number of flagged patients per build, keeping the rest flagged', async () => {
    const [keepA, mergeA] = await makeTwoPatients(models);
    const [keepB, mergeB] = await makeTwoPatients(models);
    const a = await makeEncounterRecords(mergeA.id);
    const b = await makeEncounterRecords(mergeB.id);
    await centralSyncManager.updateLookupTable();
    await mergePatient(models, keepA.id, mergeA.id, false);
    await mergePatient(models, keepB.id, mergeB.id, false);
    await centralSyncManager.updateLookupTable();
    expect(await lookupPatientIdFor('prescriptions', a.prescription.id)).toBe(mergeA.id);
    expect(await lookupPatientIdFor('prescriptions', b.prescription.id)).toBe(mergeB.id);

    CentralSyncManager.overrideConfig({
      ...config,
      sync: {
        ...config.sync,
        lookupTable: { ...config.sync.lookupTable, maxFlaggedPatientsPerBuild: 1 },
      },
    });
    try {
      await models.LocalSystemFact.flagLookupPatientsForRebuild([mergeA.id, mergeB.id]);

      await centralSyncManager.updateLookupTable();
      expect(await lookupPatientIdFor('prescriptions', a.prescription.id)).toBe(keepA.id);
      expect(await lookupPatientIdFor('prescriptions', b.prescription.id)).toBe(mergeB.id);
      expect(await models.LocalSystemFact.getLookupPatientsToRebuild()).toEqual([mergeB.id]);

      await centralSyncManager.updateLookupTable();
      expect(await lookupPatientIdFor('prescriptions', b.prescription.id)).toBe(keepB.id);
      expect(await models.LocalSystemFact.getLookupPatientsToRebuild()).toEqual([]);
    } finally {
      CentralSyncManager.restoreConfig();
    }
  });

  describe('rebuild flag bookkeeping', () => {
    it('stores a flagged patient once however many times it is flagged', async () => {
      await models.LocalSystemFact.flagLookupPatientsForRebuild(['patient-a', 'patient-b']);
      await models.LocalSystemFact.flagLookupPatientsForRebuild(['patient-a']);

      expect(await models.LocalSystemFact.getLookupPatientsToRebuild()).toEqual([
        'patient-a',
        'patient-b',
      ]);

      await models.LocalSystemFact.markLookupPatientsRebuilt(['patient-a', 'patient-b']);
    });

    it('stores a patient once when a single batch names it twice', async () => {
      await models.LocalSystemFact.flagLookupPatientsForRebuild([
        'patient-a',
        'patient-b',
        'patient-a',
      ]);

      expect(await models.LocalSystemFact.getLookupPatientsToRebuild()).toEqual([
        'patient-a',
        'patient-b',
      ]);

      await models.LocalSystemFact.markLookupPatientsRebuilt(['patient-a', 'patient-b']);
    });

    it('clears only the rebuilt ids, so a patient flagged mid-build survives', async () => {
      await models.LocalSystemFact.flagLookupPatientsForRebuild(['patient-a']);
      // a merge commits while the build is running, after it read the flag list
      await models.LocalSystemFact.flagLookupPatientsForRebuild(['patient-b']);

      await models.LocalSystemFact.markLookupPatientsRebuilt(['patient-a']);

      expect(await models.LocalSystemFact.getLookupPatientsToRebuild()).toEqual(['patient-b']);

      await models.LocalSystemFact.markLookupPatientsRebuilt(['patient-b']);
      expect(await models.LocalSystemFact.getLookupPatientsToRebuild()).toEqual([]);
    });
  });
});
