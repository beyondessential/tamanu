import config from 'config';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { splitIds } from './utilities.js';

export const DEPARTMENTS = splitIds(`
  Medical
  Renal
  Emergency
  Surgical
  Diabetes
  HIV
  Tuberculosis
  Paediatric
  Neonatal
  Antenatal
  Laboratory
  Radiology
  Pharmacy
`);

export const seedDepartments = async (models) => {
  const [facilityId] = selectFacilityIds(config);
  const departments = DEPARTMENTS.map((d) => ({ ...d, code: d.name, facilityId }));
  return models.Department.bulkCreate(departments);
};
