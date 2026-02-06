import { SEX_VALUES } from '@tamanu/constants';

// These types are structurally compatible with the Database models but defined here
// to avoid circular dependencies between utils and database packages.
export type LabTestTypeLike = {
  maleMax?: number;
  femaleMax?: number;
  maleMin?: number;
  femaleMin?: number;
  rangeText?: string;
  unit?: string;
};

export type LabTestReferenceRangeOverride = {
  referenceRangeMin?: number;
  referenceRangeMax?: number;
};

type getTranslation = (
  stringId: string,
  fallback: string,
  translationOptions?: {
    casing?: 'lower' | 'upper' | 'sentence';
    replacements?: Record<string, any>;
  },
) => string;

const hasValue = (value?: number | string) => value || value === 0;

interface GetReferenceRangeProps<T extends LabTestTypeLike = LabTestTypeLike> {
  labTestType?: T;
  labTest?: LabTestReferenceRangeOverride | null;
  sex?: keyof typeof SEX_VALUES | null;
  getTranslation: getTranslation;
}

export const getReferenceRange = ({
  labTestType,
  labTest,
  sex,
  getTranslation,
}: GetReferenceRangeProps) => {
  if (!labTestType) return '';

  const hasOverride =
    labTest && (hasValue(labTest.referenceRangeMin) || hasValue(labTest.referenceRangeMax));
  const max = hasOverride
    ? labTest.referenceRangeMax
    : sex === SEX_VALUES.MALE
      ? labTestType.maleMax
      : labTestType.femaleMax;
  const min = hasOverride
    ? labTest.referenceRangeMin
    : sex === SEX_VALUES.MALE
      ? labTestType.maleMin
      : labTestType.femaleMin;
  const hasMax = hasValue(max);
  const hasMin = hasValue(min);

  let baseRange: string;
  if (hasMin && hasMax)
    baseRange = getTranslation('general.fallback.range', ':min - :max', {
      replacements: { min, max },
    });
  else if (hasMin)
    baseRange = getTranslation('general.fallback.greaterThan', '>:min', { replacements: { min } });
  else if (hasMax)
    baseRange = getTranslation('general.fallback.lessThan', '<:max', { replacements: { max } });
  else if (labTestType.rangeText) baseRange = labTestType.rangeText;
  else baseRange = getTranslation('general.fallback.notApplicable', 'N/A', { casing: 'lower' });

  return baseRange;
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
