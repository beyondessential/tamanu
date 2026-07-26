import { SEX_VALUES } from '@tamanu/constants';
import { isNil } from 'es-toolkit/compat';

// These types are structurally compatible with the Database models but defined here
// to avoid circular dependencies between utils and database packages.
export type LabTestTypeLike = {
  maleMax?: number | null;
  femaleMax?: number | null;
  maleMin?: number | null;
  femaleMin?: number | null;
  rangeText?: string | null;
  unit?: string | null;
};

export type LabTestReferenceRangeOverride = {
  referenceRangeMin?: number | null;
  referenceRangeMax?: number | null;
  referenceRangeText?: string | null;
};

type getTranslation = (
  stringId: string,
  fallback: string,
  translationOptions?: {
    casing?: 'lower' | 'upper' | 'sentence';
    replacements?: Record<string, any>;
  },
) => string;

type SexValue = (typeof SEX_VALUES)[keyof typeof SEX_VALUES];

interface GetReferenceRangeProps<T extends LabTestTypeLike = LabTestTypeLike> {
  labTestType?: T;
  labTest?: LabTestReferenceRangeOverride | null;
  sex?: SexValue | null;
  getTranslation: getTranslation;
}

interface ResolveReferenceRangeProps<T extends LabTestTypeLike = LabTestTypeLike> {
  labTestType?: T;
  labTest?: LabTestReferenceRangeOverride | null;
  sex?: SexValue | null;
}

type ResolvedReferenceRange = {
  min: number | null;
  max: number | null;
  rangeText: string | null;
};

// Single source of truth for a lab test's effective reference range. It applies the
// override priority (per-test numeric override → per-test text → sex-based type range →
// type text) and merges partial numeric overrides with the type defaults. Both the
// displayed reference string (getReferenceRange) and the out-of-range highlight
// (getLabTestValidationCriteria) build on this so they can never disagree.
const resolveLabTestReferenceRange = ({
  labTestType,
  labTest,
  sex,
}: ResolveReferenceRangeProps): ResolvedReferenceRange => {
  const empty: ResolvedReferenceRange = { min: null, max: null, rangeText: null };
  if (!labTestType) return empty;

  const overrideMax = labTest?.referenceRangeMax;
  const overrideMin = labTest?.referenceRangeMin;
  const hasNumericOverride = !isNil(overrideMax) || !isNil(overrideMin);

  // Per-test text override, only when there are no per-test numeric overrides
  if (!hasNumericOverride && labTest?.referenceRangeText)
    return { ...empty, rangeText: labTest.referenceRangeText };

  const { defaultMax, defaultMin } =
    sex === SEX_VALUES.MALE
      ? { defaultMax: labTestType.maleMax, defaultMin: labTestType.maleMin }
      : sex === SEX_VALUES.FEMALE
        ? { defaultMax: labTestType.femaleMax, defaultMin: labTestType.femaleMin }
        : ({} as { defaultMax?: number | null; defaultMin?: number | null });
  const max = isNil(overrideMax) ? defaultMax : overrideMax;
  const min = isNil(overrideMin) ? defaultMin : overrideMin;
  const hasMax = !isNil(max);
  const hasMin = !isNil(min);

  if (hasMin || hasMax)
    return { min: hasMin ? min! : null, max: hasMax ? max! : null, rangeText: null };
  if (labTestType.rangeText) return { ...empty, rangeText: labTestType.rangeText };
  return empty;
};

export const getReferenceRange = ({
  labTestType,
  labTest,
  sex,
  getTranslation,
}: GetReferenceRangeProps) => {
  if (!labTestType) return '';

  const { min, max, rangeText } = resolveLabTestReferenceRange({ labTestType, labTest, sex });
  const hasMax = !isNil(max);
  const hasMin = !isNil(min);

  if (hasMin && hasMax)
    return getTranslation('general.fallback.range', ':min–:max', { replacements: { min, max } });
  if (hasMin)
    return getTranslation('general.fallback.greaterThan', '>:min', { replacements: { min } });
  if (hasMax)
    return getTranslation('general.fallback.lessThan', '<:max', { replacements: { max } });
  if (rangeText) return rangeText;
  return getTranslation('general.fallback.notApplicable', 'N/A', { casing: 'lower' });
};

export type LabTestValidationCriteria = {
  normalRange: { min?: number | null; max?: number | null } | null;
  rangeText: string | null;
};

// Derives the criteria a results cell uses to flag an out-of-range value, from the same
// resolved range as the displayed reference string. A numeric bound (either side) yields a
// normalRange; otherwise a qualitative rangeText is compared against the result.
export const getLabTestValidationCriteria = ({
  labTestType,
  labTest,
  sex,
}: ResolveReferenceRangeProps): LabTestValidationCriteria => {
  if (!labTestType) return { normalRange: null, rangeText: null };

  const { min, max, rangeText } = resolveLabTestReferenceRange({ labTestType, labTest, sex });
  const hasMax = !isNil(max);
  const hasMin = !isNil(min);

  if (hasMin || hasMax) {
    return {
      normalRange: { min: hasMin ? min : undefined, max: hasMax ? max : undefined },
      rangeText: null,
    };
  }
  return { normalRange: null, rangeText };
};

// Sex-keyed range shape returned by the patient lab-results endpoint, where the type range
// is already resolved per sex rather than exposed as flat maleMin/femaleMin fields.
export type NormalRangesBySex = {
  male?: { min?: number | null; max?: number | null } | null;
  female?: { min?: number | null; max?: number | null } | null;
};

// Adapter for that endpoint shape: keeps the mapping to LabTestTypeLike in one place so the
// patient results table doesn't hand-assemble a synthetic labTestType at the call site.
export const getLabTestValidationCriteriaFromNormalRanges = ({
  normalRanges,
  rangeText,
  labTest,
  sex,
}: {
  normalRanges?: NormalRangesBySex | null;
  rangeText?: string | null;
  labTest?: LabTestReferenceRangeOverride | null;
  sex?: SexValue | null;
}): LabTestValidationCriteria =>
  getLabTestValidationCriteria({
    labTestType: {
      maleMin: normalRanges?.male?.min,
      maleMax: normalRanges?.male?.max,
      femaleMin: normalRanges?.female?.min,
      femaleMax: normalRanges?.female?.max,
      rangeText,
    },
    labTest,
    sex,
  });

export const getReferenceRangeWithUnit = ({
  labTestType,
  labTest,
  sex,
  getTranslation,
}: GetReferenceRangeProps) => {
  if (!labTestType) return '';

  const referenceRange = getReferenceRange({ labTestType, labTest, sex, getTranslation });
  const { unit } = labTestType;
  if (!unit) return referenceRange;
  if (
    referenceRange === getTranslation('general.fallback.notApplicable', 'N/A', { casing: 'lower' })
  )
    return referenceRange;
  return `${referenceRange} ${unit}`;
};
