import config from 'config';
import { splitIds } from './utilities';

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

export const seedDepartments = async models => {
  const departments = DEPARTMENTS.map(d => ({
    ...d,
    code: d.name,
    facilityId: config.serverFacilityId,
  }));
  return models.Department.bulkCreate(departments);
};
