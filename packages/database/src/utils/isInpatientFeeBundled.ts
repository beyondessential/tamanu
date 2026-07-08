import { ENCOUNTER_TYPES, type InpatientBundledCategory } from '@tamanu/constants';
import type { Models } from '../types/model';

// Admission-only: at a facility that bundles this category the item is covered by the admission
// fee, so it's not auto-added to the invoice (returns true to suppress it). False everywhere else.
// Callers already have the encounter loaded, so it's passed in rather than re-fetched by id.
export const isInpatientFeeBundled = async (
  models: Models,
  encounter: { encounterType?: string | null; locationId?: string | null } | null | undefined,
  category: InpatientBundledCategory,
): Promise<boolean> => {
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
