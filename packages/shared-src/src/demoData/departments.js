import { randomRecordId, splitIds } from './utilities';

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
  const facilityId = await randomRecordId(models, 'Facility');
  const departments = DEPARTMENTS.map(d => ({ ...d, code: d.name, facilityId }));
  return models.Department.bulkCreate(departments);
};
