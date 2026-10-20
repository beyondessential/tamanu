import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import config from 'config';
import { createDummyPatient } from '@tamanu/database/demoData/patients';
import { disableHardcodedPermissionsForSuite } from '@tamanu/shared/test-helpers';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

import { createTestContext } from '../utilities';

const MARK_FOR_SYNC_PERMISSIONS = [
  ['read', 'Patient'],
  ['create', 'SyncPatient'],
];

describe('PatientFacility', () => {
  let baseApp;
  let models;
  let ctx;
  let facilityId;
  let runSyncSpy;

  disableHardcodedPermissionsForSuite();

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    [facilityId] = selectFacilityIds(config);
    runSyncSpy = vi.spyOn(ctx.syncConnection, 'runSync').mockResolvedValue(undefined);
  });
  afterAll(() => ctx.close());

  beforeEach(() => {
    runSyncSpy.mockClear();
  });

  const createPatient = async () => models.Patient.create(await createDummyPatient(models));

  describe('POST /', () => {
    it('marks the patient for sync at the current facility and triggers an urgent sync', async () => {
      const patient = await createPatient();
      const app = await baseApp.asNewRole(MARK_FOR_SYNC_PERMISSIONS);

      const result = await app
        .post('/api/patientFacility')
        .send({ patientId: patient.id, facilityId });

      expect(result).toHaveSucceeded();
      expect(result.body).toMatchObject({ patientId: patient.id, facilityId });
      const marks = await models.PatientFacility.count({
        where: { patientId: patient.id, facilityId },
      });
      expect(marks).toBe(1);
      expect(runSyncSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          urgent: true,
          type: 'patientMarkedForSync',
          patientId: patient.id,
        }),
      );
    });

    it('succeeds without creating a duplicate mark for a patient already marked', async () => {
      const patient = await createPatient();
      await models.PatientFacility.create({ patientId: patient.id, facilityId });
      const app = await baseApp.asNewRole(MARK_FOR_SYNC_PERMISSIONS);

      const result = await app
        .post('/api/patientFacility')
        .send({ patientId: patient.id, facilityId });

      expect(result).toHaveSucceeded();
      const marks = await models.PatientFacility.count({
        where: { patientId: patient.id, facilityId },
      });
      expect(marks).toBe(1);
    });

    it('refuses a user without create SyncPatient', async () => {
      const patient = await createPatient();
      const app = await baseApp.asNewRole([['read', 'Patient']]);

      const result = await app
        .post('/api/patientFacility')
        .send({ patientId: patient.id, facilityId });

      expect(result).toBeForbidden();
      const marks = await models.PatientFacility.count({ where: { patientId: patient.id } });
      expect(marks).toBe(0);
      expect(runSyncSpy).not.toHaveBeenCalled();
    });

    it('refuses a user without read Patient', async () => {
      const patient = await createPatient();
      const app = await baseApp.asNewRole([['create', 'SyncPatient']]);

      const result = await app
        .post('/api/patientFacility')
        .send({ patientId: patient.id, facilityId });

      expect(result).toBeForbidden();
      const marks = await models.PatientFacility.count({ where: { patientId: patient.id } });
      expect(marks).toBe(0);
    });

    it('rejects an unauthenticated request', async () => {
      const patient = await createPatient();

      const result = await baseApp
        .post('/api/patientFacility')
        .send({ patientId: patient.id, facilityId });

      expect(result).toHaveRequestError();
      const marks = await models.PatientFacility.count({ where: { patientId: patient.id } });
      expect(marks).toBe(0);
      expect(runSyncSpy).not.toHaveBeenCalled();
    });

    it('returns not found for a patient that does not exist', async () => {
      const app = await baseApp.asNewRole(MARK_FOR_SYNC_PERMISSIONS);

      const result = await app
        .post('/api/patientFacility')
        .send({ patientId: 'no-such-patient', facilityId });

      expect(result).toHaveStatus(404);
    });
  });
});
