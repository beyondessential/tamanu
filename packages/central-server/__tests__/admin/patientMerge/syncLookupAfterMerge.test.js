import { fake } from '@tamanu/fake-data/fake';
import { FACT_CURRENT_SYNC_TICK } from '@tamanu/constants';

import { CentralSyncManager } from '../../../app/sync/CentralSyncManager';
import {
  getLookupSweepExcludedTables,
  mergePatient,
} from '../../../app/admin/patientMerge/mergePatient';
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

  const lookupPatientIdFor = async (recordType, recordId) => {
    const row = await models.SyncLookup.findOne({ where: { recordType, recordId } });
    return row?.patientId;
  };

  // One encounter carrying a record of each shape the child-association walk misses: a prescription
  // across a belongsToMany, its MAR one hop further out, and a lab request log whose parent never
  // declares it.
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

    await mergePatient(models, keep.id, merge.id);
    await centralSyncManager.updateLookupTable();

    for (const [recordType, recordId] of scopedRecordTypes) {
      expect([recordType, await lookupPatientIdFor(recordType, recordId)]).toEqual([
        recordType,
        keep.id,
      ]);
    }
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
  });

  it('rescopes records stranded by an earlier merge even when this run repoints nothing', async () => {
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

    await new PatientMergeMaintainer(ctx).remergePatientRecords();
    await centralSyncManager.updateLookupTable();

    expect(await lookupPatientIdFor('prescriptions', prescription.id)).toBe(keep.id);
  });

  it('sweeps join-derived scope tables and skips own-column scope tables', async () => {
    const excluded = await getLookupSweepExcludedTables(models);

    // scope derived through joins can go stale without the row being touched, so these must be swept
    for (const table of [
      'prescriptions',
      'encounter_prescriptions',
      'medication_administration_records',
      'lab_request_logs',
      'patient_ongoing_prescriptions',
    ]) {
      expect(excluded).not.toContain(table);
    }

    // scope that follows the row's own column heals through repointing, and the merged patient's
    // tombstones legitimately keep the old id, so sweeping these would repeat forever
    for (const table of ['patients', 'patient_additional_data', 'patient_issues']) {
      expect(excluded).toContain(table);
    }
  });

  it('leaves records alone when dependent record resync is disabled', async () => {
    const [keep, merge] = await makeTwoPatients(models);
    const { prescription } = await makeEncounterRecords(merge.id);
    await centralSyncManager.updateLookupTable();

    await mergePatient(models, keep.id, merge.id, false);
    await centralSyncManager.updateLookupTable();

    expect(await lookupPatientIdFor('prescriptions', prescription.id)).toBe(merge.id);
  });
});
