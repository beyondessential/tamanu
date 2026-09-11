import { REFERENCE_TYPES } from '@tamanu/constants';
import type { Models, ReferenceData } from '@tamanu/database';

import { fake } from '../../fake/index.js';

// A drug is a reference_data row plus its reference_drugs row; the medication queries join both.
export const createDrug = async ({
  ReferenceData,
  ReferenceDrug,
}: Pick<Models, 'ReferenceData' | 'ReferenceDrug'>): Promise<ReferenceData> => {
  const drug = await ReferenceData.create(fake(ReferenceData, { type: REFERENCE_TYPES.DRUG }));
  await ReferenceDrug.create(fake(ReferenceDrug, { referenceDataId: drug.id }));
  return drug;
};
