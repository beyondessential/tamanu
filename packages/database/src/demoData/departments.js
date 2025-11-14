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

export const seedDepartments = async (models) => {
  let facility = await models.Facility.findOne();
  if (!facility) {
    facility = await models.Facility.create({
      code: 'default-facility',
      name: 'Default Facility',
    });
  }
  const facilityId = facility.id;
  const departments = DEPARTMENTS.map((d) => ({ ...d, code: d.name, facilityId }));
  return models.Department.bulkCreate(departments);
};
