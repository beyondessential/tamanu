import { SEX_VALUES } from "@tamanu/constants";
import type { LabTestType } from "@tamanu/database/models/LabTestType";

export type Sex = 'male' | 'female' | null | undefined;

const hasValue = (value?: number | null) => value || value === 0;

export const getReferenceRange = (labTestType?: LabTestType | null, sex?: Sex) => {
  if (!labTestType) return '';

  const max = sex === SEX_VALUES.MALE ? labTestType.maleMax : labTestType.femaleMax;
  const min = sex === SEX_VALUES.MALE ? labTestType.maleMin : labTestType.femaleMin;
  const hasMax = hasValue(max);
  const hasMin = hasValue(min);

  let baseRange: string;
  if (hasMin && hasMax) baseRange = `${min} – ${max}`;
  else if (hasMin) baseRange = `>${min}`;
  else if (hasMax) baseRange = `<${max}`;
  else if (labTestType.rangeText) baseRange = labTestType.rangeText;
  else baseRange = 'n/a';

  return baseRange;
};

export const getReferenceRangeWithUnit = (labTestType?: LabTestType | null, sex?: Sex) => {
  if (!labTestType) return '';
  
  const referenceRange = getReferenceRange(labTestType, sex);
  const { unit } = labTestType;
  if (!unit) return referenceRange;
  if (referenceRange === 'n/a') return referenceRange;
  return `${referenceRange} ${unit}`;
};
