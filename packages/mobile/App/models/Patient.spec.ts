import { mocked } from 'ts-jest/utils';

import { IPatient } from '~/types';
import { Database } from '~/infra/db';
import { readConfig } from '~/services/config';
jest.mock('~/services/config');
const mockedReadConfig = mocked(readConfig);
jest.setTimeout(60000); // can be slow to create/delete records

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
    village: null,
    villageId: null,
    title: null,
    additionalData: null,
  };
  const patients: IPatient[] = [
    { ...genericPatient, id: 'id-2' },
    { ...genericPatient, id: 'id-3' },
  ];

  beforeAll(async () => {
    mockedReadConfig.mockReturnValue(Promise.resolve('["id-1","id-3","id-2"]'));
    await Database.connect();
    await Promise.all(
      patients.map(async p => {
        await Database.models.Patient.createAndSaveOne(p);
      }),
    );
  });

  it('fixes patient order', async () => {
    const result = await Database.models.Patient.findRecentlyViewed();
    expect(result.map(r => r.id)).toEqual(['id-3', 'id-2']);
  });

  it('removes missing patients', async () => {
    const result = await Database.models.Patient.findRecentlyViewed();
    expect(result.map(r => r.id)).not.toContain('id-1');
  });
});
