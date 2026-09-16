import { REFERENCE_TYPES } from '@tamanu/constants';
import type { Models, ReferenceData } from '@tamanu/database';

import { fake } from '../../fake/index.js';

// A drug is a reference_data row plus its reference_drugs row; the medication queries join both.
export const createReferenceData = async (
  { ReferenceData, ReferenceDrug }: Pick<Models, 'ReferenceData' | 'ReferenceDrug'>,
  type: string,
): Promise<ReferenceData> => {
  const referenceData = await ReferenceData.create(fake(ReferenceData, { type }));
  if (type === REFERENCE_TYPES.DRUG) {
    await ReferenceDrug.create(fake(ReferenceDrug, { referenceDataId: referenceData.id }));
  }
  return referenceData;
};
