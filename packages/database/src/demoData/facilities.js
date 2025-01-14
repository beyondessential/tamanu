import config from 'config';
import { splitIds } from './utilities';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

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

export const seedFacilities = async (models) => {
  const facilities = FACILITIES.map((d) => ({ ...d, code: d.name }));

  // ensure that all our configured serverFacilityIds have an entry as well
  // otherwise a bunch of tests will break
  const serverFacilityIds = selectFacilityIds(config);
  if (serverFacilityIds) {
    serverFacilityIds.forEach((facilityId) => {
      if (!facilities.some((x) => x.id === facilityId)) {
        facilities.push({
          id: facilityId,
          name: facilityId,
          code: facilityId,
        });
      }
    });
  }

  return models.Facility.bulkCreate(facilities);
};
