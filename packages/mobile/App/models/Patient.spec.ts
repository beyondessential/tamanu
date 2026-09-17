import { mocked } from 'jest-mock';

import { type IPatient, ReferenceDataType } from '~/types';
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
    additionalData: null,
  };
  const village = {
    id: 'village-nadi',
    type: ReferenceDataType.Village,
    code: 'nadi',
    name: 'Nadi',
  };
  const patients: IPatient[] = [
    { ...genericPatient, id: 'id-2' },
    {
      ...genericPatient,
      id: 'id-3',
      village: { id: village.id } as IPatient['village'],
      villageId: village.id,
    },
  ];

  beforeAll(async () => {
    mockedReadConfig.mockReturnValue(Promise.resolve('["id-1","id-3","id-2"]'));
    await Database.connect();
    await Database.models.ReferenceData.createAndSaveOne(village);
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

  it('loads each patient’s village', async () => {
    const [withVillage, withoutVillage] = await Database.models.Patient.findRecentlyViewed();
    expect(withVillage.village).toMatchObject({ id: village.id, name: 'Nadi' });
    expect(withoutVillage.village).toBeNull();
  });
});
