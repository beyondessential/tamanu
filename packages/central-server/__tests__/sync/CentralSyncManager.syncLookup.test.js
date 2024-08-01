import { fake, fakeUser } from '@tamanu/shared/test-helpers/fake';
import { CentralSyncManager } from '../../dist/sync/CentralSyncManager';
import { createTestContext } from '../utilities';

describe('Sync Lookup data', () => {
  let ctx;
  let models;
  let centralSyncManager;

  beforeAll(async () => {
    ctx = await createTestContext();
    ({ models } = ctx.store);
    centralSyncManager = new CentralSyncManager(ctx);
  });

  beforeEach(async () => {
    await models.SyncLookup.truncate({ force: true });
  });

  it('Encounter lookup data is correct', async () => {
    const facility = await models.Facility.create({
      ...fake(models.Facility),
      name: 'Utopia HQ',
    });
    const location = await models.Location.create({
      ...fake(models.Location),
      facilityId: facility.id,
    });
    const department = await models.Department.create({
      ...fake(models.Department),
      facilityId: facility.id,
    });
    const examiner = await models.User.create(fakeUser());

    const patient = await models.Patient.create({
      ...fake(models.Patient),
    });
    const encounter = await models.Encounter.create({
      ...fake(models.Encounter),
      patientId: patient.id,
      locationId: location.id,
      departmentId: department.id,
      examinerId: examiner.id,
    });

    await centralSyncManager.updateLookupTable();

    const encounterLookupData = await models.SyncLookup.findOne({
      where: { recordType: 'encounters' },
    });

    expect(encounterLookupData).toEqual(
      expect.objectContaining({
        recordId: encounter.id,
        recordType: 'encounters',
        patientId: patient.id,
        encounterId: encounter.id,
        facilityId: facility.id,
        isLabRequest: false,
        isDeleted: false,
      }),
    );
  });

  it('Setting lookup data is correct', async () => {
    const facility = await models.Facility.create({
      ...fake(models.Facility),
      name: 'Utopia HQ',
    });
    const setting = await models.Setting.create({
      facilityId: facility.id,
      key: 'test',
      value: { test: 'test' },
    });

    await centralSyncManager.updateLookupTable();

    const settingLookupData = await models.SyncLookup.findOne({
      where: { recordType: 'settings' },
    });

    expect(settingLookupData).toEqual(
      expect.objectContaining({
        recordId: setting.id,
        recordType: 'settings',
        patientId: null,
        encounterId: null,
        facilityId: setting.facilityId,
        isLabRequest: false,
        isDeleted: false,
      }),
    );
  });

  it('PatientFacility lookup data is correct', async () => {
    const facility = await models.Facility.create({
      ...fake(models.Facility),
      name: 'Utopia HQ',
    });
    const patient = await models.Patient.create({
      ...fake(models.Patient),
    });
    const patientFacility = await models.PatientFacility.create({
      facilityId: facility.id,
      patientId: patient.id,
    });
    await centralSyncManager.updateLookupTable();

    const patientFacilityLookupData = await models.SyncLookup.findOne({
      where: { recordType: 'patient_facilities' },
    });

    expect(patientFacilityLookupData).toEqual(
      expect.objectContaining({
        recordId: patientFacility.id,
        recordType: 'patient_facilities',
        patientId: patient.id,
        encounterId: null,
        facilityId: facility.id,
        isLabRequest: false,
        isDeleted: false,
      }),
    );
  });
});
