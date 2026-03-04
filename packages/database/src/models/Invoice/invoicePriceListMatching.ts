import { differenceInYears, parseISO } from 'date-fns';

export const equalsIfPresent = (
  ruleVal: string | undefined,
  inputVal: string | undefined,
): boolean => {
  if (ruleVal == null) {
    return true; // If ruleVal not present, return true
  }
  return ruleVal === inputVal;
};

/**
 * @param condition - Age condition as:
 *   - number (exact age): 30
 *   - object: { min: 15, max: 64 } or { min: 65 } or { max: 14 }
 * @param dob - patient date of birth as ISO date string (e.g., "2010-10-15")
 */
export const matchesAgeIfPresent = (
  condition?: number | { min?: number; max?: number } | undefined,
  dob?: string | null,
): boolean => {
  if (!condition) {
    return true; // If condition not present, return true
  }

  if (!dob) {
    return false;
  }

  const parsedDob = parseISO(dob);
  if (!parsedDob || isNaN(parsedDob.getTime())) {
    return false;
  }

  const ageYears = differenceInYears(new Date(), parsedDob);

  // Handle exact numeric value
  if (typeof condition === 'number') {
    return ageYears === condition;
  }

  // Handle object format: { min?: number, max?: number }
  const { min, max } = condition;
  const meetsMin = min === undefined || ageYears >= min;
  const meetsMax = max === undefined || ageYears <= max;
  return meetsMin && meetsMax;
};

/**
 * Matches facility with exclusionary logic:
 * - If any price list specifies a facilityId, then price lists without a facilityId
 *   match all facilities EXCEPT those explicitly specified by other price lists
 * - If no price lists specify a facilityId, then all price lists match any facility
 */
export const matchesFacilityWithExclusionaryLogic = (
  ruleFacilityId: string | undefined,
  inputFacilityId: string | undefined,
  allRules: Array<Record<string, any>>,
): boolean => {
  // If input facility not provided, match anything
  if (!inputFacilityId) {
    return true;
  }

  // If this rule specifies a facility, do direct comparison
  if (ruleFacilityId) {
    return ruleFacilityId === inputFacilityId;
  }

  // Rule has no facilityId - apply exclusionary logic
  const specifiedFacilityIds = new Set(
    allRules.map(rule => rule?.facilityId).filter((id): id is string => id != null),
  );

  // If no rules specify facilityId, match anything
  if (specifiedFacilityIds.size === 0) {
    return true;
  }
  // Otherwise, match all facilities EXCEPT those explicitly specified
  return !specifiedFacilityIds.has(inputFacilityId);
};
