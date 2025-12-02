import { SEX_VALUES } from '@tamanu/constants';
import type { LabTestType } from '@tamanu/database/models/LabTestType';


type Sex = 'male' | 'female' | null | undefined;

const hasValue = (value?: number | null) => value || value === 0;

interface GetReferenceRangeProps {
  labTestType?: LabTestType;
  sex?: Sex;
  getTranslation: (stringId: string, fallback: string, translationOptions?: any)=> string;
}
export const getReferenceRange = ({ labTestType, sex, getTranslation }: GetReferenceRangeProps) => {
  if (!labTestType) return '';

  const max = sex === SEX_VALUES.MALE ? labTestType.maleMax : labTestType.femaleMax;
  const min = sex === SEX_VALUES.MALE ? labTestType.maleMin : labTestType.femaleMin;
  const hasMax = hasValue(max);
  const hasMin = hasValue(min);

  let baseRange: string;
  if (hasMin && hasMax) baseRange = getTranslation('general.fallback.range', ':min – :max', { replacements: { min, max } });
  else if (hasMin) baseRange = getTranslation('general.fallback.greaterThan', '>:min', { replacements: { min } });
  else if (hasMax) baseRange = getTranslation('general.fallback.lessThan', '<:max', { replacements: { max } });
  else if (labTestType.rangeText) baseRange = labTestType.rangeText;
  else baseRange = getTranslation('general.fallback.notApplicable', 'N/A');

  return baseRange;
};

export const getReferenceRangeWithUnit = ({ labTestType, sex, getTranslation }: GetReferenceRangeProps) => {
  if (!labTestType) return '';

  const referenceRange = getReferenceRange({ labTestType, sex, getTranslation });
  const { unit } = labTestType;
  if (!unit) return referenceRange;
  if (referenceRange === getTranslation('general.fallback.notApplicable', 'N/A')) return referenceRange;
  return `${referenceRange} ${unit}`;
};
