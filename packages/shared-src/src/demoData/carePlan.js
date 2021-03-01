import { splitIds } from './splitIds';

export const CARE_PLANS = splitIds(`
  Diabetes Mellitus
  Cardiovascular Disease
  Tuberculosis
  Mental Health
`).map(data => ({ ...data, type: 'carePlan' }));
