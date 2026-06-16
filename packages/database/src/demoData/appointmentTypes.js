import { splitIds } from './utilities.js';

export const APPOINTMENT_TYPES = splitIds(`
  Standard
  Emergency
  Specialist
  Other
`);
