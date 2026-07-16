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

export const getReferenceRange = ({
  labTestType,
  labTest,
  sex,
  getTranslation,
}: GetReferenceRangeProps) => {
  if (!labTestType) return '';

  const overrideMax = labTest?.referenceRangeMax;
  const overrideMin = labTest?.referenceRangeMin;
  const hasNumericOverride = !isNil(overrideMax) || !isNil(overrideMin);

  // Priority 2: per-test text override, only when there are no per-test numeric overrides
  if (!hasNumericOverride && labTest?.referenceRangeText) return labTest.referenceRangeText;

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

  if (hasMin && hasMax)
    return getTranslation('general.fallback.range', ':min–:max', { replacements: { min, max } });
  if (hasMin)
    return getTranslation('general.fallback.greaterThan', '>:min', { replacements: { min } });
  if (hasMax)
    return getTranslation('general.fallback.lessThan', '<:max', { replacements: { max } });
  if (labTestType.rangeText) return labTestType.rangeText;
  return getTranslation('general.fallback.notApplicable', 'N/A', { casing: 'lower' });
};

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
