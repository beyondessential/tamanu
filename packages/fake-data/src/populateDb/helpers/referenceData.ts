import { QueryTypes } from 'sequelize';

import { REFERENCE_TYPES } from '@tamanu/constants';
import type { Models, ReferenceData, ReferenceDrug } from '@tamanu/database';

import { fake } from '../../fake/index.js';

const createReferenceDrug = (
  { ReferenceDrug }: Pick<Models, 'ReferenceDrug'>,
  referenceDataId: string,
): Promise<ReferenceDrug> => ReferenceDrug.create(fake(ReferenceDrug, { referenceDataId }));

// A drug is a reference_data row plus its reference_drugs row; the medication queries join both.
export const createReferenceData = async (
  { ReferenceData, ReferenceDrug }: Pick<Models, 'ReferenceData' | 'ReferenceDrug'>,
  type: string,
): Promise<ReferenceData> => {
  const referenceData = await ReferenceData.create(fake(ReferenceData, { type }));
  if (type === REFERENCE_TYPES.DRUG) {
    await createReferenceDrug({ ReferenceDrug }, referenceData.id);
  }
  return referenceData;
};

// Drugs seeded before createReferenceData paired them with a reference_drugs row are still
// bare, and later rounds keep picking them. Give each one its row so prescriptions against it
// show up in dispensing. The join ignores reference_drugs.deleted_at because reference_data_id
// is unique across soft-deleted rows too.
export const backfillReferenceDrugs = async ({
  ReferenceData,
  ReferenceDrug,
}: Pick<Models, 'ReferenceData' | 'ReferenceDrug'>): Promise<void> => {
  const bareDrugs: { id: string }[] = await ReferenceData.sequelize.query(
    `
      SELECT reference_data.id
      FROM reference_data
      LEFT JOIN reference_drugs ON reference_drugs.reference_data_id = reference_data.id
      WHERE reference_data.type = :drugType
        AND reference_data.deleted_at IS NULL
        AND reference_drugs.id IS NULL
    `,
    { type: QueryTypes.SELECT, replacements: { drugType: REFERENCE_TYPES.DRUG } },
  );
  for (const { id } of bareDrugs) {
    await createReferenceDrug({ ReferenceDrug }, id);
  }
};
