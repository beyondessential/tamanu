import { Op } from 'sequelize';

import {
  FACT_CURRENT_SYNC_TICK,
  FACT_LOOKUP_UP_TO_TICK,
  FACT_LOOKUP_MODELS_TO_REBUILD,
} from '@tamanu/constants/facts';
import { SYNC_SESSION_DIRECTION } from '@tamanu/database/sync';
import { fake } from '@tamanu/fake-data/fake';

import { sleepAsync } from '@tamanu/utils/sleepAsync';
import { SYNC_DIRECTIONS, DEBUG_LOG_TYPES, SYSTEM_USER_UUID } from '@tamanu/constants';

import {
  createTestContext,
  waitForSession,
  initializeCentralSyncManagerWithContext,
} from '../utilities';
import { importerTransaction } from '../../dist/admin/importer/importerEndpoint';
import { referenceDataImporter } from '../../dist/admin/referenceDataImporter';

const doImport = (options, models) => {
  const { file, ...opts } = options;
  return importerTransaction({
    referenceDataImporter,
    file: `./__tests__/sync/testData/${file}.xlsx`,
    models,
    ...opts,
  });
};

describe('CentralSyncManager.updateLookupTable', () => {
  let ctx;
  let models;
  let sequelize;

  const DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS = 100000000;
  const initializeCentralSyncManager = config =>
    initializeCentralSyncManagerWithContext(ctx, config);

  const prepareRecordsForSync = async () => {
    // Pre insert the records below for snapshotting later
    const facility = await models.Facility.create(fake(models.Facility));
    const program = await models.Program.create({
      id: 'test-program-1',
      name: 'Program',
    });
    const survey = await models.Survey.create({
      id: 'test-survey-1',
      programId: program.id,
    });

    return [facility, program, survey];
  };

  const prepareMockedPullOnlyModelQueryPromise = async () => {
    let resolveUpdateLookupTableWaitingPromise;
    const modelQueryWaitingPromise = new Promise(resolve => {
      resolveUpdateLookupTableWaitingPromise = async () => resolve(true);
    });

    // Build the fakeModelPromise so that it can block the snapshotting process,
    // then we can insert some new records while snapshotting is happening
    let resolveMockedQueryPromise;
    const mockedModelUpdateLookupTableQueryPromise = new Promise(resolve => {
      // count: 100 is not correct but shouldn't matter in this test case
      resolveMockedQueryPromise = async () => resolve([[{ maxId: null, count: 100 }]]);
    });
    const MockedPullOnlyModel = {
      syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
      associations: [],
      getAttributes() {
        return {
          id: {},
          name: {},
        };
      },
      sequelize: {
        async query() {
          await resolveUpdateLookupTableWaitingPromise();
          return mockedModelUpdateLookupTableQueryPromise;
        },
        models,
      },
      buildSyncFilter: () => null,
      buildSyncLookupQueryDetails: () => null,
    };

    return {
      MockedPullOnlyModel,
      resolveMockedQueryPromise,
      modelQueryWaitingPromise,
    };
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models, sequelize } = ctx.store);
  });

  beforeEach(async () => {
    jest.resetModules();
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 2);
    await models.LocalSystemFact.set(FACT_LOOKUP_MODELS_TO_REBUILD, null);
    await models.SyncLookupTick.truncate({ force: true });
    await models.SyncDeviceTick.truncate({ force: true });
    await models.Facility.truncate({ cascade: true, force: true });
    await models.Program.truncate({ cascade: true, force: true });
    await models.Survey.truncate({ cascade: true, force: true });
    await models.ProgramDataElement.truncate({ cascade: true, force: true });
    await models.SurveyScreenComponent.truncate({ cascade: true, force: true });
    await models.ReferenceData.truncate({ cascade: true, force: true });
    await models.TranslatedString.truncate({ cascade: true, force: true });
    await models.User.truncate({ cascade: true, force: true });
    await models.User.create({
      id: SYSTEM_USER_UUID,
      email: 'system',
      displayName: 'System',
      role: 'system',
    });
    await models.LocalSystemFact.set(FACT_LOOKUP_UP_TO_TICK, null);
    await models.SyncLookup.truncate({ force: true });
    await models.DebugLog.truncate({ force: true });
  });

  afterAll(() => ctx.close());

  afterEach(async () => {
    // Revert to the original models
    ctx.store.models = models;
  });

  it('inserts records into sync lookup table', async () => {
    const patient1 = await models.Patient.create(fake(models.Patient));

    const centralSyncManager = initializeCentralSyncManager({
      sync: {
        lookupTable: {
          enabled: true,
        },
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
      },
    });

    await centralSyncManager.updateLookupTable();

    const lookupData = await models.SyncLookup.findAll({
      where: {
        recordId: {
          [Op.not]: SYSTEM_USER_UUID,
        },
      },
    });

    expect(lookupData).toHaveLength(1);
    expect(lookupData[0]).toEqual(
      expect.objectContaining({
        recordId: patient1.id,
        recordType: 'patients',
        data: expect.objectContaining({
          id: patient1.id,
          displayId: patient1.displayId,
          firstName: patient1.firstName,
          middleName: patient1.middleName,
          lastName: patient1.lastName,
          culturalName: patient1.culturalName,
          dateOfBirth: patient1.dateOfBirth,
          dateOfDeath: null,
          sex: patient1.sex,
          email: patient1.email,
          visibilityStatus: patient1.visibilityStatus,
          villageId: null,
          mergedIntoId: null,
        }),
        isLabRequest: false,
        isDeleted: false,
      }),
    );
  });

  it('updates new changes from records into sync lookup table', async () => {
    const patient1 = await models.Patient.create(fake(models.Patient));

    const centralSyncManager = initializeCentralSyncManager({
      sync: {
        lookupTable: {
          enabled: true,
        },
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
      },
    });

    const currentSyncTime = await models.LocalSystemFact.get(FACT_CURRENT_SYNC_TICK);

    await centralSyncManager.updateLookupTable();

    const lookupData = await models.SyncLookup.findAll({
      where: {
        recordId: {
          [Op.not]: SYSTEM_USER_UUID,
        },
      },
    });

    expect(lookupData).toHaveLength(1);
    expect(lookupData[0]).toEqual(
      expect.objectContaining({
        recordId: patient1.id,
        recordType: 'patients',
        data: expect.objectContaining({
          id: patient1.id,
          displayId: patient1.displayId,
          firstName: patient1.firstName,
          middleName: patient1.middleName,
          lastName: patient1.lastName,
          culturalName: patient1.culturalName,
          dateOfBirth: patient1.dateOfBirth,
          dateOfDeath: null,
          sex: patient1.sex,
          email: patient1.email,
          visibilityStatus: patient1.visibilityStatus,
          villageId: null,
          mergedIntoId: null,
        }),
        isLabRequest: false,
        isDeleted: false,
        updatedAtSyncTick: currentSyncTime,
      }),
    );

    patient1.firstName = 'New First Name';
    await patient1.save();

    await centralSyncManager.updateLookupTable();
    const lookupData2 = await models.SyncLookup.findAll({
      where: {
        recordId: {
          [Op.not]: SYSTEM_USER_UUID,
        },
      },
    });

    const newCurrentSyncTime = (await models.LocalSystemFact.get(FACT_CURRENT_SYNC_TICK)) - 1;

    expect(lookupData2).toHaveLength(1);
    expect(lookupData2[0]).toEqual(
      expect.objectContaining({
        recordId: patient1.id,
        recordType: 'patients',
        data: expect.objectContaining({
          id: patient1.id,
          displayId: patient1.displayId,
          firstName: 'New First Name',
          middleName: patient1.middleName,
          lastName: patient1.lastName,
          culturalName: patient1.culturalName,
          dateOfBirth: patient1.dateOfBirth,
          dateOfDeath: null,
          sex: patient1.sex,
          email: patient1.email,
          visibilityStatus: patient1.visibilityStatus,
          villageId: null,
          mergedIntoId: null,
        }),
        isLabRequest: false,
        isDeleted: false,
        updatedAtSyncTick: newCurrentSyncTime.toString(), // we take the tick for this
      }),
    );
  });

  it('fully rebuilds models that have been flagged for rebuild', async () => {
    const patient1 = await models.Patient.create(fake(models.Patient));
    const centralSyncManager = initializeCentralSyncManager({
      sync: {
        lookupTable: {
          enabled: true,
        },
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
      },
    });

    await models.LocalSystemFact.set(
      FACT_LOOKUP_UP_TO_TICK,
      parseInt(patient1.updatedAtSyncTick, 10) + 1,
    ); // Set this to skip initial build

    await centralSyncManager.updateLookupTable();

    const lookupData = await models.SyncLookup.findAll({
      where: {
        recordId: {
          [Op.not]: SYSTEM_USER_UUID,
        },
      },
    });

    expect(lookupData).toHaveLength(0);

    const patient2 = await models.Patient.create(fake(models.Patient));

    await sequelize.query(`SELECT flag_lookup_model_to_rebuild('patients')`);

    expect(await models.LocalSystemFact.getLookupModelsToRebuild()).toEqual(['patients']);

    await centralSyncManager.updateLookupTable();

    const lookupData2 = await models.SyncLookup.findAll({
      where: {
        recordId: {
          [Op.not]: SYSTEM_USER_UUID,
        },
      },
    });

    expect(lookupData2).toHaveLength(2);
    const patient1Lookup = lookupData2.find(d => d.recordId === patient1.id);
    const patient2Lookup = lookupData2.find(d => d.recordId === patient2.id);
    expect(patient1Lookup).toEqual(
      expect.objectContaining({
        recordId: patient1.id,
        recordType: 'patients',
        updatedAtSyncTick: patient1.updatedAtSyncTick, // Preserve the historic sync tick to avoid syncing historic data
        data: expect.objectContaining({
          id: patient1.id,
          displayId: patient1.displayId,
          firstName: patient1.firstName,
          middleName: patient1.middleName,
          lastName: patient1.lastName,
          culturalName: patient1.culturalName,
          dateOfBirth: patient1.dateOfBirth,
          dateOfDeath: null,
          sex: patient1.sex,
          email: patient1.email,
          visibilityStatus: patient1.visibilityStatus,
          villageId: null,
          mergedIntoId: null,
        }),
        isLabRequest: false,
        isDeleted: false,
      }),
    );
    expect(patient2Lookup).toEqual(
      expect.objectContaining({
        recordId: patient2.id,
        recordType: 'patients',
      }),
    );

    // Bumping the lookup table tick works in the same build
    expect(parseInt(patient2Lookup.updatedAtSyncTick, 10)).toBeGreaterThan(
      parseInt(patient2.updatedAtSyncTick, 10),
    );

    expect(await models.LocalSystemFact.getLookupModelsToRebuild()).toEqual([]);
  });

  it('rebuilds a model with a custom sync lookup filter (encounters)', async () => {
    // Encounters define a custom buildSyncLookupQueryDetails `where`, which used to short-circuit the
    // rebuild branch — so a rebuild only re-materialised recent rows, not every row.
    const facility = await models.Facility.create(fake(models.Facility));
    const department = await models.Department.create(
      fake(models.Department, { facilityId: facility.id }),
    );
    const location = await models.Location.create(
      fake(models.Location, { facilityId: facility.id }),
    );
    const examiner = await models.User.create(fake(models.User));
    const patient = await models.Patient.create(fake(models.Patient));
    const createEncounter = () =>
      models.Encounter.create({
        ...fake(models.Encounter),
        patientId: patient.id,
        locationId: location.id,
        departmentId: department.id,
        examinerId: examiner.id,
        endDate: null,
      });

    const historicEncounter = await createEncounter();

    const centralSyncManager = initializeCentralSyncManager({
      sync: {
        lookupTable: {
          enabled: true,
        },
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
      },
    });

    // Skip the initial build so the existing encounter counts as historic data.
    await models.LocalSystemFact.set(
      FACT_LOOKUP_UP_TO_TICK,
      parseInt(historicEncounter.updatedAtSyncTick, 10) + 1,
    );

    // An incremental refresh skips historic rows.
    await centralSyncManager.updateLookupTable();
    expect(
      await models.SyncLookup.findOne({
        where: { recordId: historicEncounter.id, recordType: 'encounters' },
      }),
    ).toBeNull();

    // A new encounter created after the cursor (the refresh above advanced the clock).
    const newEncounter = await createEncounter();

    // Flagging the model rebuilds it, re-materialising every row.
    await sequelize.query(`SELECT flag_lookup_model_to_rebuild('encounters')`);
    await centralSyncManager.updateLookupTable();

    const historicLookup = await models.SyncLookup.findOne({
      where: { recordId: historicEncounter.id, recordType: 'encounters' },
    });
    const newLookup = await models.SyncLookup.findOne({
      where: { recordId: newEncounter.id, recordType: 'encounters' },
    });

    // Historic row keeps its tick (clients don't re-pull it)...
    expect(historicLookup).not.toBeNull();
    expect(historicLookup.updatedAtSyncTick).toEqual(historicEncounter.updatedAtSyncTick);
    expect(historicLookup.isLabRequest).toBe(false);

    // ...while a row newer than the cursor gets its tick bumped.
    expect(newLookup).not.toBeNull();
    expect(parseInt(newLookup.updatedAtSyncTick, 10)).toBeGreaterThan(
      parseInt(newEncounter.updatedAtSyncTick, 10),
    );

    expect(await models.LocalSystemFact.getLookupModelsToRebuild()).toEqual([]);
  });

  it('only rebuilds the flagged models, leaving others untouched', async () => {
    const patient = await models.Patient.create(fake(models.Patient));
    const referenceData = await models.ReferenceData.create(fake(models.ReferenceData));

    const centralSyncManager = initializeCentralSyncManager({
      sync: {
        lookupTable: {
          enabled: true,
        },
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
      },
    });

    // Skip the initial build so both records count as historic (an incremental refresh skips them).
    await models.LocalSystemFact.set(
      FACT_LOOKUP_UP_TO_TICK,
      Math.max(
        parseInt(patient.updatedAtSyncTick, 10),
        parseInt(referenceData.updatedAtSyncTick, 10),
      ) + 1,
    );
    await centralSyncManager.updateLookupTable();
    expect(
      await models.SyncLookup.findAll({ where: { recordId: { [Op.not]: SYSTEM_USER_UUID } } }),
    ).toHaveLength(0);

    // Flag only patients.
    await sequelize.query(`SELECT flag_lookup_model_to_rebuild('patients')`);
    await centralSyncManager.updateLookupTable();

    // Only the patient is rebuilt; the (also historic) reference data is left out of the lookup.
    const lookupData = await models.SyncLookup.findAll({
      where: { recordId: { [Op.not]: SYSTEM_USER_UUID } },
    });
    expect(lookupData).toHaveLength(1);
    expect(lookupData[0].recordId).toEqual(patient.id);
  });

  it('rebuild refreshes a row data without changing its tick', async () => {
    const patient = await models.Patient.create(fake(models.Patient));

    const centralSyncManager = initializeCentralSyncManager({
      sync: {
        lookupTable: {
          enabled: true,
        },
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
      },
    });

    // Initial build puts the patient in the lookup at its base tick.
    await centralSyncManager.updateLookupTable();
    const before = await models.SyncLookup.findOne({
      where: { recordId: patient.id, recordType: 'patients' },
    });
    expect(before.data.firstName).toEqual(patient.firstName);

    // Simulate the materialised data drifting out of date.
    await models.SyncLookup.update(
      { data: { ...before.data, firstName: 'STALE' } },
      { where: { recordId: patient.id, recordType: 'patients' } },
    );

    // A rebuild refreshes the data from the base table, but leaves the tick untouched.
    await sequelize.query(`SELECT flag_lookup_model_to_rebuild('patients')`);
    await centralSyncManager.updateLookupTable();

    const after = await models.SyncLookup.findOne({
      where: { recordId: patient.id, recordType: 'patients' },
    });
    expect(after.data.firstName).toEqual(patient.firstName); // refreshed, not 'STALE'
    expect(after.updatedAtSyncTick).toEqual(before.updatedAtSyncTick); // tick unchanged
  });

  it('rebuilds prescriptions, resolving the patient via the ongoing link', async () => {
    const patient = await models.Patient.create(fake(models.Patient));
    const prescription = await models.Prescription.create(fake(models.Prescription));
    await models.PatientOngoingPrescription.create({
      ...fake(models.PatientOngoingPrescription),
      prescriptionId: prescription.id,
      patientId: patient.id,
    });

    const centralSyncManager = initializeCentralSyncManager({
      sync: {
        lookupTable: {
          enabled: true,
        },
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
      },
    });

    // Skip the initial build so the prescription counts as historic.
    await models.LocalSystemFact.set(
      FACT_LOOKUP_UP_TO_TICK,
      parseInt(prescription.updatedAtSyncTick, 10) + 1,
    );
    await centralSyncManager.updateLookupTable();
    expect(
      await models.SyncLookup.findOne({
        where: { recordId: prescription.id, recordType: 'prescriptions' },
      }),
    ).toBeNull();

    await sequelize.query(`SELECT flag_lookup_model_to_rebuild('prescriptions')`);
    await centralSyncManager.updateLookupTable();

    const lookup = await models.SyncLookup.findOne({
      where: { recordId: prescription.id, recordType: 'prescriptions' },
    });
    expect(lookup).not.toBeNull();
    expect(lookup.patientId).toEqual(patient.id); // resolved via patient_ongoing_prescriptions
    expect(lookup.updatedAtSyncTick).toEqual(prescription.updatedAtSyncTick); // historic tick preserved
  });

  it('incremental carries a prescription over on an ongoing-link update, and a rebuild keeps that tick', async () => {
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 10);
    const prescription = await models.Prescription.create(fake(models.Prescription));
    const prescriptionTick = parseInt(prescription.updatedAtSyncTick, 10);

    const centralSyncManager = initializeCentralSyncManager({
      sync: {
        lookupTable: {
          enabled: true,
        },
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
      },
    });

    // Materialise the prescription first (no patient link yet). Not an initial build; the refresh
    // advances the clock, so afterwards the prescription's own tick is historic.
    await models.LocalSystemFact.set(FACT_LOOKUP_UP_TO_TICK, prescriptionTick - 1);
    await centralSyncManager.updateLookupTable();

    const initial = await models.SyncLookup.findOne({
      where: { recordId: prescription.id, recordType: 'prescriptions' },
    });
    expect(initial).not.toBeNull();
    expect(initial.patientId).toBeNull();
    const initialTick = parseInt(initial.updatedAtSyncTick, 10);

    // Link it to a patient at a much later tick — the prescription row itself doesn't change, so only
    // the OR on patient_ongoing_prescriptions can carry it back into the lookup (no rebuild involved).
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, prescriptionTick + 1000);
    const patient = await models.Patient.create(fake(models.Patient));
    await models.PatientOngoingPrescription.create({
      ...fake(models.PatientOngoingPrescription),
      prescriptionId: prescription.id,
      patientId: patient.id,
    });

    await centralSyncManager.updateLookupTable();

    const afterLink = await models.SyncLookup.findOne({
      where: { recordId: prescription.id, recordType: 'prescriptions' },
    });
    // Re-materialised with the new patient association and a bumped tick (so lagging clients re-pull).
    expect(afterLink.patientId).toEqual(patient.id);
    const bumpedTick = parseInt(afterLink.updatedAtSyncTick, 10);
    expect(bumpedTick).toBeGreaterThan(initialTick);

    // A subsequent rebuild refreshes the data but must keep that bumped tick — not regress it to the
    // prescription's own (older) base tick.
    await sequelize.query(`SELECT flag_lookup_model_to_rebuild('prescriptions')`);
    await centralSyncManager.updateLookupTable();

    const afterRebuild = await models.SyncLookup.findOne({
      where: { recordId: prescription.id, recordType: 'prescriptions' },
    });
    expect(parseInt(afterRebuild.updatedAtSyncTick, 10)).toEqual(bumpedTick);
    expect(afterRebuild.patientId).toEqual(patient.id);
    expect(await models.LocalSystemFact.getLookupModelsToRebuild()).toEqual([]);
  });

  it('one refresh both bumps an incremental change and preserves a rebuilt row tick', async () => {
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 10);
    const rebuiltPatient = await models.Patient.create(fake(models.Patient));

    const centralSyncManager = initializeCentralSyncManager({
      sync: {
        lookupTable: {
          enabled: true,
        },
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
      },
    });

    // Materialise rebuiltPatient via a non-initial refresh, so its lookup tick is bumped above its
    // own tick — that way "preserved" later is unambiguous (it differs from the base tick).
    await models.LocalSystemFact.set(
      FACT_LOOKUP_UP_TO_TICK,
      parseInt(rebuiltPatient.updatedAtSyncTick, 10) - 1,
    );
    await centralSyncManager.updateLookupTable();

    const preserved = await models.SyncLookup.findOne({
      where: { recordId: rebuiltPatient.id, recordType: 'patients' },
    });
    const preservedTick = parseInt(preserved.updatedAtSyncTick, 10);
    expect(preservedTick).toBeGreaterThan(parseInt(rebuiltPatient.updatedAtSyncTick, 10));

    // A brand-new patient created after that refresh = an incremental change for the next one.
    const incrementalPatient = await models.Patient.create(fake(models.Patient));

    // One refresh that does both passes: rebuild patients (flagged) AND pick up incrementalPatient.
    await sequelize.query(`SELECT flag_lookup_model_to_rebuild('patients')`);
    await centralSyncManager.updateLookupTable();

    const rebuiltLookup = await models.SyncLookup.findOne({
      where: { recordId: rebuiltPatient.id, recordType: 'patients' },
    });
    const incrementalLookup = await models.SyncLookup.findOne({
      where: { recordId: incrementalPatient.id, recordType: 'patients' },
    });

    // The unchanged, rebuilt row keeps its tick...
    expect(parseInt(rebuiltLookup.updatedAtSyncTick, 10)).toEqual(preservedTick);
    // ...while the incrementally-added row is bumped above its own tick.
    expect(parseInt(incrementalLookup.updatedAtSyncTick, 10)).toBeGreaterThan(
      parseInt(incrementalPatient.updatedAtSyncTick, 10),
    );
    expect(await models.LocalSystemFact.getLookupModelsToRebuild()).toEqual([]);
  });

  it('one refresh preserves a rebuilt prescription tick and bumps one updated via its ongoing link', async () => {
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 10);
    const rebuiltPrescription = await models.Prescription.create(fake(models.Prescription));
    const incrementalPrescription = await models.Prescription.create(fake(models.Prescription));

    const centralSyncManager = initializeCentralSyncManager({
      sync: {
        lookupTable: {
          enabled: true,
        },
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
      },
    });

    // Materialise both prescriptions via a non-initial refresh, so their lookup ticks are bumped
    // above their own ticks (makes "preserved" unambiguous).
    await models.LocalSystemFact.set(
      FACT_LOOKUP_UP_TO_TICK,
      parseInt(rebuiltPrescription.updatedAtSyncTick, 10) - 1,
    );
    await centralSyncManager.updateLookupTable();

    const preserved = await models.SyncLookup.findOne({
      where: { recordId: rebuiltPrescription.id, recordType: 'prescriptions' },
    });
    const preservedTick = parseInt(preserved.updatedAtSyncTick, 10);
    expect(preservedTick).toBeGreaterThan(parseInt(rebuiltPrescription.updatedAtSyncTick, 10));

    // incrementalPrescription is unchanged itself, but gets linked to a patient (ongoing) at a much
    // later tick — an incremental change carried only via patient_ongoing_prescriptions.
    await models.LocalSystemFact.set(FACT_CURRENT_SYNC_TICK, 1000);
    const patient = await models.Patient.create(fake(models.Patient));
    await models.PatientOngoingPrescription.create({
      ...fake(models.PatientOngoingPrescription),
      prescriptionId: incrementalPrescription.id,
      patientId: patient.id,
    });

    // One refresh, both passes: rebuild prescriptions (flagged) + carry over the ongoing-link change.
    await sequelize.query(`SELECT flag_lookup_model_to_rebuild('prescriptions')`);
    await centralSyncManager.updateLookupTable();

    const rebuiltLookup = await models.SyncLookup.findOne({
      where: { recordId: rebuiltPrescription.id, recordType: 'prescriptions' },
    });
    const incrementalLookup = await models.SyncLookup.findOne({
      where: { recordId: incrementalPrescription.id, recordType: 'prescriptions' },
    });

    // The unchanged, rebuilt prescription keeps its tick...
    expect(parseInt(rebuiltLookup.updatedAtSyncTick, 10)).toEqual(preservedTick);
    // ...while the one whose ongoing link changed is bumped and resolves to the patient.
    expect(incrementalLookup.patientId).toEqual(patient.id);
    expect(parseInt(incrementalLookup.updatedAtSyncTick, 10)).toBeGreaterThan(
      parseInt(incrementalPrescription.updatedAtSyncTick, 10),
    );
    expect(await models.LocalSystemFact.getLookupModelsToRebuild()).toEqual([]);
  });

  it('allows having the same recordId but different record_type in sync lookup table', async () => {
    const patient1 = await models.Patient.create(fake(models.Patient));
    await models.ReferenceData.create(
      fake(models.ReferenceData, { id: patient1.id }), // use the same id between patient and reference_data
    );

    const centralSyncManager = initializeCentralSyncManager({
      sync: {
        lookupTable: {
          enabled: true,
        },
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
      },
    });

    const currentSyncTime = await models.LocalSystemFact.get(FACT_CURRENT_SYNC_TICK);

    await centralSyncManager.updateLookupTable();

    const lookupData = await models.SyncLookup.findAll({
      where: {
        recordId: {
          [Op.not]: SYSTEM_USER_UUID,
        },
      },
    });

    expect(lookupData).toHaveLength(2);
    expect(lookupData.find(d => d.recordType === 'patients')).toEqual(
      expect.objectContaining({
        recordId: patient1.id,
        recordType: 'patients',
        data: expect.objectContaining({
          id: patient1.id,
          displayId: patient1.displayId,
          firstName: patient1.firstName,
          middleName: patient1.middleName,
          lastName: patient1.lastName,
          culturalName: patient1.culturalName,
          dateOfBirth: patient1.dateOfBirth,
          dateOfDeath: null,
          sex: patient1.sex,
          email: patient1.email,
          visibilityStatus: patient1.visibilityStatus,
          villageId: null,
          mergedIntoId: null,
        }),
        isLabRequest: false,
        isDeleted: false,
        updatedAtSyncTick: currentSyncTime,
      }),
    );

    patient1.firstName = 'New First Name';
    await patient1.save();

    await centralSyncManager.updateLookupTable();
    const lookupData2 = await models.SyncLookup.findAll({
      where: {
        recordId: {
          [Op.not]: SYSTEM_USER_UUID,
        },
      },
    });

    const newCurrentSyncTime = (await models.LocalSystemFact.get(FACT_CURRENT_SYNC_TICK)) - 1;

    expect(lookupData2).toHaveLength(2);
    expect(lookupData2.find(d => d.recordType === 'patients')).toEqual(
      expect.objectContaining({
        recordId: patient1.id,
        recordType: 'patients',
        data: expect.objectContaining({
          id: patient1.id,
          displayId: patient1.displayId,
          firstName: 'New First Name',
          middleName: patient1.middleName,
          lastName: patient1.lastName,
          culturalName: patient1.culturalName,
          dateOfBirth: patient1.dateOfBirth,
          dateOfDeath: null,
          sex: patient1.sex,
          email: patient1.email,
          visibilityStatus: patient1.visibilityStatus,
          villageId: null,
          mergedIntoId: null,
        }),
        isLabRequest: false,
        isDeleted: false,
        updatedAtSyncTick: newCurrentSyncTime.toString(),
      }),
    );
  });

  it('does not include records inserted when updating lookup table already started', async () => {
    const records = await prepareRecordsForSync();
    const program = records[1];

    // Build the fakeModelPromise so that it can block the updateLookupTable process,
    // then we can insert some new records while updateLookupTable is happening
    const { resolveMockedQueryPromise, modelQueryWaitingPromise, MockedPullOnlyModel } =
      await prepareMockedPullOnlyModelQueryPromise();

    ctx.store.models = {
      MockedPullOnlyModel,
      ...models,
    };

    const centralSyncManager = initializeCentralSyncManager({
      sync: {
        lookupTable: {
          enabled: true,
        },
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
      },
    });

    // Start the update lookup table process
    const updateLookupTablePromise = centralSyncManager.updateLookupTable();

    // wait until updateLookupTable() reaches the point of querying for MockedModel
    // and block the process inside the wrapper transaction,
    await modelQueryWaitingPromise;

    // Insert the records just before we release the lock,
    // meaning that we're inserting the records below in the middle of the updateLookupTable process,
    // and they SHOULD NOT be included sync_lookup
    const survey2 = await models.Survey.create({
      id: 'test-survey-2',
      programId: program.id,
    });
    const dataElement = await models.ProgramDataElement.create({
      name: 'Profile picture',
      defaultText: 'abcd',
      code: 'ProfilePhoto',
      type: 'Photo',
    });
    await models.SurveyScreenComponent.create({
      dataElementId: dataElement.id,
      surveyId: survey2.id,
      componentIndex: 0,
      text: 'Photo',
      screenIndex: 0,
    });

    // Now release the lock to see if the lookup table captures the newly inserted records above
    await resolveMockedQueryPromise();
    await sleepAsync(20);

    await updateLookupTablePromise;

    const lookupData = await models.SyncLookup.findAll({
      where: {
        recordId: {
          [Op.not]: SYSTEM_USER_UUID,
        },
      },
    });

    // only expect 3 records as it should not include the 3 records inserted manually
    expect(lookupData).toHaveLength(3);
  });

  it('does not include records inserted from importer when updating lookup table already started', async () => {
    await prepareRecordsForSync();

    // Build the fakeModelPromise so that it can block the updateLookupTable process,
    // then we can insert some new records while updateLookupTable is happening
    const { resolveMockedQueryPromise, modelQueryWaitingPromise, MockedPullOnlyModel } =
      await prepareMockedPullOnlyModelQueryPromise();

    ctx.store.models = {
      MockedPullOnlyModel,
      ...models,
    };

    const centralSyncManager = initializeCentralSyncManager({
      sync: {
        lookupTable: {
          enabled: true,
        },
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
      },
    });

    // Start the update lookup table process
    const updateLookupTablePromise = centralSyncManager.updateLookupTable();

    // wait until updateLookupTable() reaches the point of querying for MockedModel
    // and block the process inside the wrapper transaction,
    await modelQueryWaitingPromise;

    // Insert the records just before we release the lock,
    // meaning that we're inserting the records below in the middle of the updateLookupTable process.
    // and they SHOULD NOT be included sync_lookup,
    await doImport({ file: 'refdata-valid', dryRun: false }, models);

    // Now release the lock to see if the lookup table captures the newly inserted records above
    await resolveMockedQueryPromise();
    await sleepAsync(20);

    await updateLookupTablePromise;

    const lookupData = await models.SyncLookup.findAll({
      where: {
        recordId: {
          [Op.not]: SYSTEM_USER_UUID,
        },
      },
    });

    // only expect 3 records as it should not include the 3 records inserted from the importer
    expect(lookupData).toHaveLength(3);
  });

  it('does not include records inserted from another sync session when updating lookup table already started', async () => {
    await prepareRecordsForSync();

    // Build the fakeModelPromise so that it can block the updateLookupTable process,
    // then we can insert some new records while updateLookupTable is happening
    const { resolveMockedQueryPromise, modelQueryWaitingPromise, MockedPullOnlyModel } =
      await prepareMockedPullOnlyModelQueryPromise();

    ctx.store.models = {
      MockedPullOnlyModel,
      ...models,
    };

    const centralSyncManager = initializeCentralSyncManager();

    // Start the update lookup table process
    const updateLookupTablePromise = centralSyncManager.updateLookupTable();

    // wait until updateLookupTable() reaches the point of querying for MockedModel
    // and block the process inside the wrapper transaction,
    await modelQueryWaitingPromise;

    const patient1 = await models.Patient.create({
      ...fake(models.Patient),
    });
    const patient2 = await models.Patient.create({
      ...fake(models.Patient),
    });
    const patient3 = await models.Patient.create({
      ...fake(models.Patient),
    });

    const changes = [
      {
        direction: SYNC_SESSION_DIRECTION.OUTGOING,
        isDeleted: false,
        recordType: 'patients',
        recordId: patient1.id,
        data: patient1,
      },
      {
        direction: SYNC_SESSION_DIRECTION.OUTGOING,
        isDeleted: false,
        recordType: 'patients',
        recordId: patient2.id,
        data: patient2,
      },
      {
        direction: SYNC_SESSION_DIRECTION.OUTGOING,
        isDeleted: false,
        recordType: 'patients',
        recordId: patient3.id,
        data: patient3,
      },
    ];

    const { sessionId: sessionIdTwo } = await centralSyncManager.startSession();
    await waitForSession(centralSyncManager, sessionIdTwo);

    await centralSyncManager.addIncomingChanges(sessionIdTwo, changes);
    await centralSyncManager.completePush(sessionIdTwo);

    // Now release the lock to see if the lookup table captures the newly inserted records above
    await resolveMockedQueryPromise();
    await sleepAsync(20);

    await updateLookupTablePromise;

    const lookupData = await models.SyncLookup.findAll({
      where: {
        recordId: {
          [Op.not]: SYSTEM_USER_UUID,
        },
      },
    });
    // only expect 3 records as it should not include the 3 records inserted from another sync session
    expect(lookupData).toHaveLength(3);
  });

  it('records info about updating sync_lookup in debug log', async () => {
    await models.Patient.create(fake(models.Patient));

    await models.LocalSystemFact.set(FACT_LOOKUP_UP_TO_TICK, 6);

    const centralSyncManager = initializeCentralSyncManager({
      sync: {
        lookupTable: {
          enabled: true,
        },
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
      },
    });

    await centralSyncManager.updateLookupTable();

    const debugLogs = await models.DebugLog.findAll({});
    expect(debugLogs).toHaveLength(1);
    expect(debugLogs[0]).toMatchObject({
      id: expect.anything(),
      type: DEBUG_LOG_TYPES.SYNC_LOOKUP_UPDATE,
      info: {
        since: '6',
        incrementalCount: 0,
        rebuildCount: 0,
        startedAt: expect.anything(),
        completedAt: expect.anything(),
      },
    });
  });

  it('records error thrown when updating sync_lookup in debug log', async () => {
    const centralSyncManager = initializeCentralSyncManager({
      sync: {
        lookupTable: {
          enabled: true,
        },
        maxRecordsPerSnapshotChunk: DEFAULT_MAX_RECORDS_PER_SNAPSHOT_CHUNKS,
      },
    });

    centralSyncManager.tickTockGlobalClock = jest.fn().mockImplementation(() => {
      throw new Error('Test error');
    });

    try {
      await centralSyncManager.updateLookupTable();
    } catch (e) {
      //swallow error
    }

    const debugLogs = await models.DebugLog.findAll({});
    expect(debugLogs).toHaveLength(1);
    expect(debugLogs[0]).toMatchObject({
      id: expect.anything(),
      type: DEBUG_LOG_TYPES.SYNC_LOOKUP_UPDATE,
      info: {
        error: 'Test error',
        startedAt: expect.anything(),
        completedAt: expect.anything(),
      },
    });
  });
});
