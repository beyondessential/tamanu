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
  sex?: keyof typeof SEX_VALUES | null,
  getTranslation: getTranslation;
}

export const getReferenceRange = ({ labTestType, sex, getTranslation }: GetReferenceRangeProps) => {
  if (!labTestType) return '';

  let max: number | undefined;
  let min: number | undefined;
  if (sex === SEX_VALUES.MALE) {
    max = labTestType.maleMax;
    min = labTestType.maleMin;
  } else if (sex === SEX_VALUES.FEMALE) {
    max = labTestType.femaleMax;
    min = labTestType.femaleMin;
  }
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
  sex,
  getTranslation,
}: GetReferenceRangeProps) => {
  if (!labTestType) return '';

  const referenceRange = getReferenceRange({ labTestType, sex, getTranslation });
  const { unit } = labTestType;
  if (!unit) return referenceRange;
  if (
    referenceRange === getTranslation('general.fallback.notApplicable', 'N/A', { casing: 'lower' })
  )
    return referenceRange;
  return `${referenceRange} ${unit}`;
};
