import { SYNDROMIC_SURVEILLANCE_NO_SYNDROME_ID } from '@tamanu/constants';

function toSyndromicSurveillanceResponse(encounterSyndromeId, encounterId, tickedSyndromeIds) {
  return {
    id: encounterSyndromeId,
    encounterId,
    noSyndrome: tickedSyndromeIds.has(SYNDROMIC_SURVEILLANCE_NO_SYNDROME_ID),
    symptomIds: [...tickedSyndromeIds].filter(
      syndromeId => syndromeId !== SYNDROMIC_SURVEILLANCE_NO_SYNDROME_ID,
    ),
  };
}

/**
 * Shared by the standalone syndromic surveillance endpoints and the discharge endpoint, so both
 * paths record data the same way regardless of when in the encounter it happens.
 *
 * Relies on the ambient CLS transaction, so callers must already be inside one where this write
 * has to stand or fall with the rest of their work. Also assumes `encounterId` refers to an
 * existing encounter — callers that haven't already loaded/checked it should do so first.
 */
export async function upsertEncounterSyndromicSurveillance(
  models,
  encounterId,
  { noSyndrome, symptomIds },
) {
  const { EncounterSyndrome, EncounterSyndromeItem } = models;

  const [encounterSyndrome] = await EncounterSyndrome.findOrCreate({
    where: { encounterId },
  });

  const tickedSyndromeIds = new Set(symptomIds ?? []);
  if (noSyndrome) {
    tickedSyndromeIds.add(SYNDROMIC_SURVEILLANCE_NO_SYNDROME_ID);
  }

  const existingItems = await EncounterSyndromeItem.findAll({
    where: { encounterSyndromeId: encounterSyndrome.id },
  });

  const idsToUncheck = existingItems
    .filter(item => item.checked && !tickedSyndromeIds.has(item.syndromeId))
    .map(item => item.id);

  if (tickedSyndromeIds.size > 0) {
    await EncounterSyndromeItem.bulkCreate(
      [...tickedSyndromeIds].map(syndromeId => ({
        encounterSyndromeId: encounterSyndrome.id,
        syndromeId,
        checked: true,
      })),
      { updateOnDuplicate: ['checked'] },
    );
  }
  if (idsToUncheck.length > 0) {
    await EncounterSyndromeItem.update({ checked: false }, { where: { id: idsToUncheck } });
  }

  return toSyndromicSurveillanceResponse(encounterSyndrome.id, encounterId, tickedSyndromeIds);
}

export async function getEncounterSyndromicSurveillance(models, encounterId) {
  const { EncounterSyndrome } = models;

  const encounterSyndrome = await EncounterSyndrome.findOne({
    where: { encounterId },
    include: EncounterSyndrome.getListReferenceAssociations(),
  });

  if (!encounterSyndrome) {
    return null;
  }

  const tickedSyndromeIds = new Set(
    encounterSyndrome.items.filter(item => item.checked).map(item => item.syndromeId),
  );
  return toSyndromicSurveillanceResponse(encounterSyndrome.id, encounterId, tickedSyndromeIds);
}
