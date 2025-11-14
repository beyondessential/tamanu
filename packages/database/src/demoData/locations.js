import { splitIds } from './utilities';

export const LOCATIONS = splitIds(`
  Bed 1
  Bed 2
  Bed 3
  Diabetes Clinic
  Resuscitation
  Short-Stay
  Acute Area
  Waiting Area
`);

export const seedLocations = async (models) => {
  let facility = await models.Facility.findOne();
  if (!facility) {
    facility = await models.Facility.create({
      code: 'default-facility',
      name: 'Default Facility',
    });
  }
  const facilityId = facility.id;
  const locations = LOCATIONS.map((d) => ({ ...d, code: d.name, facilityId, maxOccupancy: 1 }));
  return models.Location.bulkCreate(locations);
};

export const LOCATIONS_GROUPS = splitIds(`
  Ward 1
  Ward 2
  Ward 3
  Diabetes Clinic
  Resuscitation
  Short-Stay
  Acute Area
  Waiting Area
`);

export const seedLocationGroups = async (models) => {
  let facility = await models.Facility.findOne();
  if (!facility) {
    facility = await models.Facility.create({
      code: 'default-facility',
      name: 'Default Facility',
    });
  }
  const facilityId = facility.id;
  const locationGroups = LOCATIONS_GROUPS.map((d) => ({ ...d, code: d.name, facilityId }));
  return models.LocationGroup.bulkCreate(locationGroups);
};
