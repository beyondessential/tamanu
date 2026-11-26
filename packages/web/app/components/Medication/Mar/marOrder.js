import { ADMINISTRATION_FREQUENCIES } from '@tamanu/constants';

const getMarRank = medication => {
  if (medication.discontinued) return 2;
  return medication.frequency === ADMINISTRATION_FREQUENCIES.IMMEDIATELY ? 0 : 1;
};

export const compareMarMedications = (a, b) => getMarRank(a) - getMarRank(b);
