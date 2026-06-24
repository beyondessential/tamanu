import { ENCOUNTER_TYPES } from '@tamanu/constants';
import type { Models } from '../types/model';

/**
 * Whether a clinical-item category is bundled into the admission fee for the encounter's facility.
 *
 * Bundling applies only to admission encounters: a bundled category is not auto-added to the
 * admission invoice (it's covered by the admission fee) but is still auto-added for outpatient/ER.
 */
export const isInpatientFeeBundled = async (
  models: Models,
  encounterId: string,
  category: string,
): Promise<boolean> => {
  const encounter = await models.Encounter.findByPk(encounterId, {
    attributes: ['encounterType', 'locationId'],
  });
  if (!encounter || encounter.encounterType !== ENCOUNTER_TYPES.ADMISSION) {
    return false;
  }

  const location = encounter.locationId
    ? await models.Location.findByPk(encounter.locationId, { attributes: ['facilityId'] })
    : null;
  if (!location?.facilityId) {
    return false;
  }

  const bundledCategories = await models.Setting.get(
    'invoicing.inpatientFee.bundledCategories',
    location.facilityId,
  );
  return Array.isArray(bundledCategories) && bundledCategories.includes(category);
};
