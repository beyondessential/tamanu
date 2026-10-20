import { mocked } from 'jest-mock';

import { Database } from '~/infra/db';
import { readConfig } from '~/services/config';
import { ReferenceDataType } from '~/types';
import { fakePatient } from '/root/tests/helpers/fake';
import { CURRENT_SYNC_TIME } from '../constants';
import { setSyncTick } from './setSyncTick';
import { snapshotOutgoingChanges } from './snapshotOutgoingChanges';

jest.mock('~/services/config');
const mockedReadConfig = mocked(readConfig);
jest.setTimeout(60000); // can be slow to create/delete records

// Saving patient data marks the patient for sync against the configured facility, so one must exist.
const FACILITY_ID = 'facility-snapshot-spec';
const SNAPSHOT_TICK = 10;

beforeAll(async () => {
  mockedReadConfig.mockReturnValue(Promise.resolve(FACILITY_ID));
  await Database.connect();
  await Database.models.Facility.createAndSaveOne({
    id: FACILITY_ID,
    code: FACILITY_ID,
    name: 'Snapshot spec facility',
  });
  await setSyncTick(Database.models, CURRENT_SYNC_TIME, SNAPSHOT_TICK);
});

describe('snapshotOutgoingChanges', () => {
  it('pushes a row as its own columns and relation ids, without relation objects', async () => {
    const { models } = Database;
    const country = await models.ReferenceData.createAndSaveOne({
      id: 'country-fiji',
      type: ReferenceDataType.Country,
      code: 'fiji',
      name: 'Fiji',
    });
    const patient = await models.Patient.createAndSaveOne(fakePatient());
    await models.PatientAdditionalData.createAndSaveOne({
      patient: patient.id,
      country: { id: country.id },
      placeOfBirth: 'Suva',
    });

    const records = await snapshotOutgoingChanges(
      { PatientAdditionalData: models.PatientAdditionalData },
      SNAPSHOT_TICK - 1,
    );
    const record = records.find(({ recordId }) => recordId === patient.id);

    expect(record).toMatchObject({
      recordType: 'patient_additional_data',
      isDeleted: false,
      data: {
        id: patient.id,
        patientId: patient.id,
        countryId: country.id,
        placeOfBirth: 'Suva',
        updatedAtByField: expect.objectContaining({ place_of_birth: SNAPSHOT_TICK }),
      },
    });
    expect(record.data).not.toHaveProperty('country');
    expect(record.data).not.toHaveProperty('patient');
    expect(record.data).not.toHaveProperty('createdAt');
    expect(record.data).not.toHaveProperty('updatedAt');
    expect(record.data).not.toHaveProperty('updatedAtSyncTick');
  });

  it('includes soft-deleted rows, flagged as deleted', async () => {
    const { models } = Database;
    const village = await models.ReferenceData.createAndSaveOne({
      id: 'village-nasinu',
      type: ReferenceDataType.Village,
      code: 'nasinu',
      name: 'Nasinu',
    });
    const patient = await models.Patient.createAndSaveOne({
      ...fakePatient(),
      villageId: village.id,
    });
    await models.Patient.softRemove(patient);

    const records = await snapshotOutgoingChanges({ Patient: models.Patient }, SNAPSHOT_TICK - 1);
    const record = records.find(({ recordId }) => recordId === patient.id);

    expect(record).toMatchObject({
      recordType: 'patients',
      isDeleted: true,
      data: { id: patient.id, villageId: village.id, deletedAt: expect.any(Date) },
    });
    expect(record.data).not.toHaveProperty('village');
  });

  it('skips rows not updated since the given tick', async () => {
    const { models } = Database;
    const patient = await models.Patient.createAndSaveOne(fakePatient());

    const records = await snapshotOutgoingChanges({ Patient: models.Patient }, SNAPSHOT_TICK);

    expect(records.map(({ recordId }) => recordId)).not.toContain(patient.id);
  });

  it('queries without eager relations', async () => {
    const { models } = Database;
    const find = jest.spyOn(models.PatientAdditionalData, 'find');
    try {
      await snapshotOutgoingChanges(
        { PatientAdditionalData: models.PatientAdditionalData },
        SNAPSHOT_TICK - 1,
      );
      expect(find).toHaveBeenCalledWith(
        expect.objectContaining({ loadEagerRelations: false, withDeleted: true }),
      );
    } finally {
      find.mockRestore();
    }
  });
});
