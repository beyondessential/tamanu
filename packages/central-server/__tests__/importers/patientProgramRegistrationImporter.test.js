import { write, utils } from 'xlsx';
import { fake } from '@tamanu/fake-data/fake';
import { REGISTRATION_STATUSES } from '@tamanu/constants';
import { importerTransaction } from '../../app/admin/importer/importerEndpoint';
import { patientProgramRegistrationImporter } from '../../app/admin/patientProgramRegistrationImporter';
import { createTestContext } from '../utilities';

jest.setTimeout(60000);

// Excel serial date ~2024-03-15
const TEST_EXCEL_DATE = 45366;

function buildWorkbook(sheets) {
  const sheetNames = Object.keys(sheets);
  const workbookSheets = {};

  for (const [sheetName, { headers, rows }] of Object.entries(sheets)) {
    const ws = {};

    headers.forEach((h, idx) => {
      const cell = utils.encode_cell({ r: 0, c: idx });
      ws[cell] = { t: 's', v: h };
    });

    rows.forEach((row, rIdx) => {
      headers.forEach((h, cIdx) => {
        const v = row[h];
        if (v === undefined || v === null) return;
        const cell = utils.encode_cell({ r: rIdx + 1, c: cIdx });
        const isNum = typeof v === 'number';
        ws[cell] = isNum ? { t: 'n', v } : { t: 's', v: String(v) };
      });
    });

    ws['!ref'] = utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: rows.length, c: headers.length - 1 },
    });

    workbookSheets[sheetName] = ws;
  }

  return write({ SheetNames: sheetNames, Sheets: workbookSheets }, { type: 'buffer', bookType: 'xlsx' });
}

const PPR_HEADERS = [
  'date',
  'registration_status',
  'patient_display_id',
  'program_registry_id',
  'clinical_status_id',
  'clinician_id',
  'registering_facility_id',
  'program_registry_condition_ids',
  'program_registry_condition_category_id',
];

describe('PatientProgramRegistration import', () => {
  let ctx;
  let models;
  let patient;
  let clinician;
  let programRegistry;
  let facility;
  let clinicalStatus;
  let condition;
  let conditionCategory;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;

    // Seed required reference data
    clinician = await models.User.create(fake(models.User));
    facility = await models.Facility.create(fake(models.Facility));
    patient = await models.Patient.create(
      fake(models.Patient, { displayId: 'TEST-PPR-001' }),
    );
    programRegistry = await models.ProgramRegistry.create(
      fake(models.ProgramRegistry, { id: 'test-registry-1', name: 'Test Registry' }),
    );
    clinicalStatus = await models.ProgramRegistryClinicalStatus.create(
      fake(models.ProgramRegistryClinicalStatus, {
        programRegistryId: programRegistry.id,
        name: 'Active Status',
      }),
    );
    condition = await models.ProgramRegistryCondition.create(
      fake(models.ProgramRegistryCondition, {
        programRegistryId: programRegistry.id,
        code: 'test-cond-1',
        name: 'Test Condition',
      }),
    );
    conditionCategory = await models.ProgramRegistryConditionCategory.create(
      fake(models.ProgramRegistryConditionCategory, {
        programRegistryId: programRegistry.id,
        code: 'test-cat-1',
        name: 'Test Category',
      }),
    );
  });

  afterAll(async () => {
    await ctx.close();
  });

  function doImport(options) {
    const { buffer, ...opts } = options;
    return importerTransaction({
      importer: patientProgramRegistrationImporter,
      data: buffer,
      models,
      checkPermission: () => true,
      ...opts,
    });
  }

  function buildPprBuffer(rows) {
    return buildWorkbook({ ppr: { headers: PPR_HEADERS, rows } });
  }

  it('should create registrations from valid data', async () => {
    const buffer = buildPprBuffer([
      {
        date: TEST_EXCEL_DATE,
        registration_status: REGISTRATION_STATUSES.ACTIVE,
        patient_display_id: patient.displayId,
        program_registry_id: programRegistry.id,
        clinician_id: clinician.id,
        registering_facility_id: facility.id,
        clinical_status_id: clinicalStatus.id,
      },
    ]);

    const { errors, stats } = await doImport({ buffer });

    expect(errors).toEqual([]);
    expect(stats).toMatchObject({
      PatientProgramRegistration: { created: 1, updated: 0, errored: 0 },
    });

    const registration = await models.PatientProgramRegistration.findOne({
      where: { patientId: patient.id, programRegistryId: programRegistry.id },
    });
    expect(registration).toBeTruthy();
    expect(registration.clinicianId).toEqual(clinician.id);
    expect(registration.registrationStatus).toEqual(REGISTRATION_STATUSES.ACTIVE);
  });

  it('should create registrations with conditions', async () => {
    // Use a second patient to avoid conflicts with the first test
    const patient2 = await models.Patient.create(
      fake(models.Patient, { displayId: 'TEST-PPR-002' }),
    );

    const buffer = buildPprBuffer([
      {
        date: TEST_EXCEL_DATE,
        registration_status: REGISTRATION_STATUSES.ACTIVE,
        patient_display_id: patient2.displayId,
        program_registry_id: programRegistry.id,
        clinician_id: clinician.id,
        program_registry_condition_ids: condition.id,
        program_registry_condition_category_id: conditionCategory.id,
      },
    ]);

    const { errors, stats } = await doImport({ buffer });

    expect(errors).toEqual([]);
    expect(stats).toMatchObject({
      PatientProgramRegistration: { created: 1, errored: 0 },
      PatientProgramRegistrationCondition: { created: 1 },
    });

    const registration = await models.PatientProgramRegistration.findOne({
      where: { patientId: patient2.id, programRegistryId: programRegistry.id },
    });
    const conditions = await models.PatientProgramRegistrationCondition.findAll({
      where: { patientProgramRegistrationId: registration.id },
    });
    expect(conditions).toHaveLength(1);
    expect(conditions[0].programRegistryConditionId).toEqual(condition.id);
  });

  it('should error on invalid patient_display_id', async () => {
    const buffer = buildPprBuffer([
      {
        date: TEST_EXCEL_DATE,
        registration_status: REGISTRATION_STATUSES.ACTIVE,
        patient_display_id: 'NONEXISTENT-123',
        program_registry_id: programRegistry.id,
        clinician_id: clinician.id,
      },
    ]);

    const { didntSendReason, errors, stats } = await doImport({ buffer });

    expect(didntSendReason).toEqual('validationFailed');
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toMatch(/NONEXISTENT-123/);
    expect(stats).toMatchObject({
      PatientProgramRegistration: { created: 0, errored: 1 },
    });
  });

  it('should throw when ppr sheet is missing', async () => {
    const buffer = buildWorkbook({
      wrong_name: {
        headers: ['col1'],
        rows: [{ col1: 'val' }],
      },
    });

    const { didntSendReason, errors } = await doImport({ buffer });

    expect(didntSendReason).toEqual('validationFailed');
    expect(errors[0].message).toMatch(/ppr/);
  });

  it('should not persist data on dry run', async () => {
    const patient3 = await models.Patient.create(
      fake(models.Patient, { displayId: 'TEST-PPR-003' }),
    );

    const buffer = buildPprBuffer([
      {
        date: TEST_EXCEL_DATE,
        registration_status: REGISTRATION_STATUSES.ACTIVE,
        patient_display_id: patient3.displayId,
        program_registry_id: programRegistry.id,
        clinician_id: clinician.id,
      },
    ]);

    const { didntSendReason, errors, stats } = await doImport({ buffer, dryRun: true });

    expect(didntSendReason).toEqual('dryRun');
    expect(errors).toEqual([]);
    expect(stats).toMatchObject({
      PatientProgramRegistration: { created: 1, errored: 0 },
    });

    // Verify nothing was persisted
    const registration = await models.PatientProgramRegistration.findOne({
      where: { patientId: patient3.id, programRegistryId: programRegistry.id },
    });
    expect(registration).toBeNull();
  });

  it('should error on invalid registration_status', async () => {
    const patient4 = await models.Patient.create(
      fake(models.Patient, { displayId: 'TEST-PPR-004' }),
    );

    const buffer = buildPprBuffer([
      {
        date: TEST_EXCEL_DATE,
        registration_status: 'bogus_status',
        patient_display_id: patient4.displayId,
        program_registry_id: programRegistry.id,
        clinician_id: clinician.id,
      },
    ]);

    const { didntSendReason, errors } = await doImport({ buffer });

    expect(didntSendReason).toEqual('validationFailed');
    expect(errors[0].message).toMatch(/bogus_status/);
  });

  it('should upsert an existing registration on re-import', async () => {
    const patient5 = await models.Patient.create(
      fake(models.Patient, { displayId: 'TEST-PPR-005' }),
    );

    const baseRow = {
      date: TEST_EXCEL_DATE,
      registration_status: REGISTRATION_STATUSES.ACTIVE,
      patient_display_id: patient5.displayId,
      program_registry_id: programRegistry.id,
      clinician_id: clinician.id,
    };

    // First import — creates
    const { errors: createErrors, stats: createStats } = await doImport({
      buffer: buildPprBuffer([baseRow]),
    });
    expect(createErrors).toEqual([]);
    expect(createStats).toMatchObject({
      PatientProgramRegistration: { created: 1, updated: 0 },
    });

    // Second import — updates
    const { errors: updateErrors, stats: updateStats } = await doImport({
      buffer: buildPprBuffer([{ ...baseRow, registration_status: REGISTRATION_STATUSES.INACTIVE }]),
    });
    expect(updateErrors).toEqual([]);
    expect(updateStats).toMatchObject({
      PatientProgramRegistration: { updated: 1, created: 0 },
    });

    const registration = await models.PatientProgramRegistration.findOne({
      where: { patientId: patient5.id, programRegistryId: programRegistry.id },
    });
    expect(registration.registrationStatus).toEqual(REGISTRATION_STATUSES.INACTIVE);
  });

  it('should require condition category when condition ids are provided', async () => {
    const patient6 = await models.Patient.create(
      fake(models.Patient, { displayId: 'TEST-PPR-006' }),
    );

    const buffer = buildPprBuffer([
      {
        date: TEST_EXCEL_DATE,
        registration_status: REGISTRATION_STATUSES.ACTIVE,
        patient_display_id: patient6.displayId,
        program_registry_id: programRegistry.id,
        clinician_id: clinician.id,
        program_registry_condition_ids: condition.id,
        // no category id
      },
    ]);

    const { didntSendReason, errors } = await doImport({ buffer });

    expect(didntSendReason).toEqual('validationFailed');
    expect(errors[0].message).toMatch(/program_registry_condition_category_id is required/);
  });
});
