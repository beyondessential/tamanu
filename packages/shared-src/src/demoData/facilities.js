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
  return models.Facility.bulkCreate(facilities);
};
