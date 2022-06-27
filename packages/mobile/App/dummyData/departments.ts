import { splitIds } from './utilities';

export const DEPARTMENTS = splitIds(
  `
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
`,
);
