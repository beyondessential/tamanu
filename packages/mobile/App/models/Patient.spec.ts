import { mocked } from 'ts-jest/utils';
import { chunk, sortedIndexOf } from 'lodash';

import { fakePatient, fakeEncounter } from '/root/tests/helpers/fake';
import { time } from '/root/tests/helpers/benchmark';
import { IPatient } from '~/types';
import { Patient } from '~/models/Patient';
import { Database } from '~/infra/db';
import { readConfig } from '~/services/config';
jest.mock('~/services/config');
const mockedReadConfig = mocked(readConfig);

beforeAll(async () => {
  await Database.connect();
});

describe('findRecentlyViewed', () => {
  const genericPatient = {
    displayId: 'fred',
    firstName: 'Fredman',
    middleName: 'Fredby',
    lastName: 'Frederson',
    sex: 'fred',
    dateOfBirth: new Date(1971, 5, 1),
    culturalName: 'Fredde',
    bloodType: 'FRED+'
  };
  const patients: IPatient[] = [
    { ...genericPatient, id: 'id-2' },
    { ...genericPatient, id: 'id-3' },
  ];

  beforeAll(async () => {
    mockedReadConfig.mockReturnValue(Promise.resolve('["id-1","id-3","id-2"]'));
    await Database.connect();
    await Promise.all(patients.map(async p => {
      await Database.models.Patient.createAndSaveOne(p);
    }));
  });

  it('fixes patient order', async () => {
    const result = await Database.models.Patient.findRecentlyViewed()
    expect(result.map(r => r.id)).toEqual(['id-3', 'id-2']);
  });

  it('removes missing patients', async () => {
    const result = await Database.models.Patient.findRecentlyViewed()
    expect(result.map(r => r.id)).not.toContain('id-1');
  });
});

describe('getSyncable', () => {
  const CHUNK_SIZE = 50;
  const patients = [];
  const encounters = [];

  jest.setTimeout(60000); // can be slow to create/delete records

  afterEach(async () => {
    for (const encounterChunk of chunk(encounters, CHUNK_SIZE)) {
      await Database.models.Encounter.delete(encounterChunk);
    }
    for (const patientChunk of chunk(patients, CHUNK_SIZE)) {
      await Database.models.Patient.delete(patientChunk);
    }
  });

  it('completes in less than 5s with 30k patients and 3k encounters', async () => {
    // arrange
    for (let i = 0; i < (30 * 1000); i++) {
      // create patient
      const patient = fakePatient();
      patient.markedForSync = true;
      patients.push(patient);

      // create encounter for 1 in 10 patients
      if (i % 10 === 0) {
        const encounter = fakeEncounter();
        encounter.patient = patient;
        encounter.markedForUpload = true;
        encounters.push(encounter);
      }
    }
    for (const patientChunk of chunk(patients, CHUNK_SIZE)) {
      await Database.models.Patient.insert(patientChunk);
    }
    for (const encounterChunk of chunk(encounters, CHUNK_SIZE)) {
      await Database.models.Encounter.insert(encounterChunk);
    }

    // act
    let syncablePatients: Patient[];
    const nanoseconds = await time(async () => {
      syncablePatients = await Database.models.Patient.getSyncable();
    })

    // assert
    const milliseconds = nanoseconds / BigInt(1e+6);
    expect(milliseconds).toBeLessThan(5000);
    expect(syncablePatients.length).toBeGreaterThanOrEqual(30000);

    const expectedIds = patients.map(p => p.id).sort();
    for (const id of syncablePatients.map(p => p.id).sort()) {
      // jest expect.arrayContaining is too slow to use here, so we use binary search
      expect(sortedIndexOf(expectedIds, id)).not.toEqual(-1);
    }
  });
});
