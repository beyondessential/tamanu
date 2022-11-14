import { randomRecordId, splitIds } from './utilities';

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

export const seedLocations = async models => {
  const facilityId = await randomRecordId(models, 'Facility');
  const locations = LOCATIONS.map(d => ({ ...d, code: d.name, facilityId, maxOccupancy: 1 }));
  return models.Location.bulkCreate(locations);
};
