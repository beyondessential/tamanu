import config from 'config';
import { splitIds } from './utilities';

export const FACILITIES = splitIds(`
  Balwyn
  Hawthorn East
  Kerang
  Lake Charm
  Marla
  Mont Albert
  National Medical
  Port Douglas
  Swan Hill
  Thornbury
  Traralgon
`);

export const seedFacilities = async models => {
  const facilities = FACILITIES.map(d => ({ ...d, code: d.name }));

  // ensure that whatever our configured serverFacilityId is has an entry as well
  // otherwise a bunch of tests will break
  const { serverFacilityId } = config;
  if (serverFacilityId && !facilities.some(x => x.id === serverFacilityId)) {
    facilities.push({
      id: serverFacilityId,
      name: serverFacilityId,
      code: serverFacilityId,
    });
  }

  return models.Facility.bulkCreate(facilities);
};
