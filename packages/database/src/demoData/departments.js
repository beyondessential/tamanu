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

export const seedDepartments = async (models) => {
  const facilities = await models.Facility.findAll();
  const departments = facilities.flatMap((facility) =>
    DEPARTMENTS.map((d) => ({ ...d, code: d.name, facilityId: facility.id })),
  );
  return models.Department.bulkCreate(departments);
};
