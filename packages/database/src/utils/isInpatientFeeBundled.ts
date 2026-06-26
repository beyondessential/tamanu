import { ENCOUNTER_TYPES, type InpatientBundledCategory } from '@tamanu/constants';
import type { Models } from '../types/model';

// Admission-only: at a facility that bundles this category the item is covered by the admission
// fee, so it's not auto-added to the invoice (returns true to suppress it). False everywhere else.
export const isInpatientFeeBundled = async (
  models: Models,
  encounterId: string,
  category: InpatientBundledCategory,
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
