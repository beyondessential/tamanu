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
  const facilities = await models.Facility.findAll();
  const locations = facilities.flatMap((facility) =>
    LOCATIONS.map((d) => ({
      ...d,
      id: `${facility.id}:${d.id}`,
      code: d.name,
      facilityId: facility.id,
      maxOccupancy: 1,
    })),
  );
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
  const facilities = await models.Facility.findAll();
  const locationGroups = facilities.flatMap((facility) =>
    LOCATIONS_GROUPS.map((d) => ({
      ...d,
      id: `${facility.id}:${d.id}`,
      code: d.name,
      facilityId: facility.id,
    })),
  );
  return models.LocationGroup.bulkCreate(locationGroups);
};
