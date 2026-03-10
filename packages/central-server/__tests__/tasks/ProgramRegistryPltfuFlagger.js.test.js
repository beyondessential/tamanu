import { sub } from 'date-fns';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import {
  ENCOUNTER_TYPES,
  POTENTIAL_LOSS_TO_FOLLOW_UP,
  REGISTRATION_STATUSES,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';

import { ProgramRegistryPltfuFlagger } from '../../dist/tasks/ProgramRegistryPltfuFlagger';
import { createTestContext } from '../utilities';

jest.setTimeout(60000);

describe('ProgramRegistryPltfuFlagger', () => {
  let ctx;
  let models;
  let patient;
  let examiner;
  let facility;
  let department;
  let location;

  const runFlagger = () => {
    const flagger = new ProgramRegistryPltfuFlagger(ctx, {
      schedule: '',
      batchSize: 100,
      batchSleepAsyncDurationInMilliseconds: 1,
    });
    return flagger.run();
  };

  const createProgramWithRegistry = async (registryOverrides = {}) => {
    const program = await models.Program.create(fake(models.Program));
    const registry = await models.ProgramRegistry.create(
      fake(models.ProgramRegistry, {
        programId: program.id,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        ...registryOverrides,
      }),
    );
    return registry;
  };

  const createPltfuClinicalStatus = async (registry) => {
    const pltfuCode = `${registry.code}-${POTENTIAL_LOSS_TO_FOLLOW_UP.CODE_SUFFIX}`;
    return models.ProgramRegistryClinicalStatus.create({
      id: `prClinicalStatus-${pltfuCode}`,
      code: pltfuCode,
      name: POTENTIAL_LOSS_TO_FOLLOW_UP.NAME,
      color: POTENTIAL_LOSS_TO_FOLLOW_UP.DEFAULT_COLOR,
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      programRegistryId: registry.id,
    });
  };

  const createClinicalStatus = async (registry, code, name) => {
    return models.ProgramRegistryClinicalStatus.create({
      id: `prClinicalStatus-${code}`,
      code,
      name,
      color: 'green',
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      programRegistryId: registry.id,
    });
  };

  const createRegistration = async (registryId, patientOverride, overrides = {}) => {
    const p = patientOverride ?? patient;
    return models.PatientProgramRegistration.create({
      patientId: p.id,
      programRegistryId: registryId,
      date: '2023-01-01 00:00:00',
      registrationStatus: REGISTRATION_STATUSES.ACTIVE,
      clinicianId: examiner.id,
      ...overrides,
    });
  };

  const createEncounter = async (patientOverride, dateOverrides = {}) => {
    return models.Encounter.create({
      patientId: patientOverride.id,
      departmentId: department.id,
      encounterType: ENCOUNTER_TYPES.CLINIC,
      locationId: location.id,
      examinerId: examiner.id,
      startDate: toDateTimeString(new Date()),
      ...dateOverrides,
    });
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    examiner = await models.User.create(fakeUser());
    facility = await models.Facility.create(fake(models.Facility));
    department = await models.Department.create({
      ...fake(models.Department),
      facilityId: facility.id,
    });
    location = await models.Location.create({
      ...fake(models.Location),
      facilityId: facility.id,
    });
  });

  beforeEach(async () => {
    patient = await models.Patient.create(fake(models.Patient));
  });

  afterAll(() => ctx.close());

  it('should not flag patients when no registries have PLTFU enabled', async () => {
    const registry = await createProgramWithRegistry({
      lossToFollowUpEnabled: false,
    });
    await createPltfuClinicalStatus(registry);
    await createRegistration(registry.id);

    await runFlagger();

    const registration = await models.PatientProgramRegistration.findOne({
      where: { patientId: patient.id, programRegistryId: registry.id },
    });
    expect(registration.clinicalStatusId).toBeNull();
  });

  it('should flag inactive patients as PLTFU', async () => {
    const registry = await createProgramWithRegistry({
      lossToFollowUpEnabled: true,
      lossToFollowUpThresholdDays: 30,
    });
    const pltfuStatus = await createPltfuClinicalStatus(registry);
    await createRegistration(registry.id);

    await runFlagger();

    const registration = await models.PatientProgramRegistration.findOne({
      where: { patientId: patient.id, programRegistryId: registry.id },
    });
    expect(registration.clinicalStatusId).toBe(pltfuStatus.id);
  });

  it('should not flag patients with recent encounters', async () => {
    const registry = await createProgramWithRegistry({
      lossToFollowUpEnabled: true,
      lossToFollowUpThresholdDays: 30,
    });
    await createPltfuClinicalStatus(registry);
    await createRegistration(registry.id);

    await createEncounter(patient);

    await runFlagger();

    const registration = await models.PatientProgramRegistration.findOne({
      where: { patientId: patient.id, programRegistryId: registry.id },
    });
    expect(registration.clinicalStatusId).toBeNull();
  });

  it('should flag patients whose encounters are older than the threshold', async () => {
    const thresholdDays = 30;
    const registry = await createProgramWithRegistry({
      lossToFollowUpEnabled: true,
      lossToFollowUpThresholdDays: thresholdDays,
    });
    const pltfuStatus = await createPltfuClinicalStatus(registry);
    await createRegistration(registry.id);

    const oldDate = toDateTimeString(sub(new Date(), { days: thresholdDays + 5 }));
    await createEncounter(patient, { startDate: oldDate });

    await runFlagger();

    const registration = await models.PatientProgramRegistration.findOne({
      where: { patientId: patient.id, programRegistryId: registry.id },
    });
    expect(registration.clinicalStatusId).toBe(pltfuStatus.id);
  });

  it('should not flag patients already marked as PLTFU', async () => {
    const registry = await createProgramWithRegistry({
      lossToFollowUpEnabled: true,
      lossToFollowUpThresholdDays: 30,
    });
    const pltfuStatus = await createPltfuClinicalStatus(registry);
    await createRegistration(registry.id, null, { clinicalStatusId: pltfuStatus.id });

    const beforeUpdate = await models.PatientProgramRegistration.findOne({
      where: { patientId: patient.id, programRegistryId: registry.id },
    });
    const originalUpdatedAt = beforeUpdate.updatedAt;

    await runFlagger();

    const registration = await models.PatientProgramRegistration.findOne({
      where: { patientId: patient.id, programRegistryId: registry.id },
    });
    expect(registration.clinicalStatusId).toBe(pltfuStatus.id);
    expect(registration.updatedAt.getTime()).toBe(originalUpdatedAt.getTime());
  });

  it('should not flag inactive registrations', async () => {
    const registry = await createProgramWithRegistry({
      lossToFollowUpEnabled: true,
      lossToFollowUpThresholdDays: 30,
    });
    await createPltfuClinicalStatus(registry);
    await createRegistration(registry.id, null, {
      registrationStatus: REGISTRATION_STATUSES.INACTIVE,
    });

    await runFlagger();

    const registration = await models.PatientProgramRegistration.findOne({
      where: { patientId: patient.id, programRegistryId: registry.id },
    });
    expect(registration.clinicalStatusId).toBeNull();
  });

  it('should respect per-registry threshold days', async () => {
    const patient2 = await models.Patient.create(fake(models.Patient));

    const shortThreshold = await createProgramWithRegistry({
      lossToFollowUpEnabled: true,
      lossToFollowUpThresholdDays: 10,
    });
    const longThreshold = await createProgramWithRegistry({
      lossToFollowUpEnabled: true,
      lossToFollowUpThresholdDays: 60,
    });
    const pltfuShort = await createPltfuClinicalStatus(shortThreshold);
    await createPltfuClinicalStatus(longThreshold);

    await createRegistration(shortThreshold.id, patient2);
    await createRegistration(longThreshold.id, patient2);

    // Encounter 15 days ago — outside 10-day threshold but within 60-day
    const fifteenDaysAgo = toDateTimeString(sub(new Date(), { days: 15 }));
    await createEncounter(patient2, { startDate: fifteenDaysAgo });

    await runFlagger();

    const shortReg = await models.PatientProgramRegistration.findOne({
      where: { patientId: patient2.id, programRegistryId: shortThreshold.id },
    });
    const longReg = await models.PatientProgramRegistration.findOne({
      where: { patientId: patient2.id, programRegistryId: longThreshold.id },
    });

    expect(shortReg.clinicalStatusId).toBe(pltfuShort.id);
    expect(longReg.clinicalStatusId).toBeNull();
  });

  it('should override existing non-PLTFU clinical status for inactive patients', async () => {
    const registry = await createProgramWithRegistry({
      lossToFollowUpEnabled: true,
      lossToFollowUpThresholdDays: 30,
    });
    const pltfuStatus = await createPltfuClinicalStatus(registry);
    const activeStatus = await createClinicalStatus(registry, `active-${registry.code}`, 'Active');

    await createRegistration(registry.id, null, { clinicalStatusId: activeStatus.id });

    await runFlagger();

    const registration = await models.PatientProgramRegistration.findOne({
      where: { patientId: patient.id, programRegistryId: registry.id },
    });
    expect(registration.clinicalStatusId).toBe(pltfuStatus.id);
  });

  it('should warn and skip when PLTFU clinical status does not exist', async () => {
    const registry = await createProgramWithRegistry({
      lossToFollowUpEnabled: true,
      lossToFollowUpThresholdDays: 30,
    });
    await createRegistration(registry.id);

    // Should not throw
    await expect(runFlagger()).resolves.not.toThrow();

    const registration = await models.PatientProgramRegistration.findOne({
      where: { patientId: patient.id, programRegistryId: registry.id },
    });
    expect(registration.clinicalStatusId).toBeNull();
  });
});
