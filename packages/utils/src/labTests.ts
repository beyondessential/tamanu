export type Sex = 'male' | 'female' | null | undefined;

type LabTestTypeLike = {
  maleMin?: number | null;
  maleMax?: number | null;
  femaleMin?: number | null;
  femaleMax?: number | null;
  rangeText?: string | null;
  unit?: string | null;
};

const hasValue = (value?: number | null) => value || value === 0;

export const getReferenceRange = (labTestType?: LabTestTypeLike | null, sex?: Sex) => {
  if (!labTestType) return '';

  const max = sex === 'male' ? labTestType.maleMax : labTestType.femaleMax;
  const min = sex === 'male' ? labTestType.maleMin : labTestType.femaleMin;
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

export const getReferenceRangeWithUnit = (labTestType?: LabTestTypeLike | null, sex?: Sex) => {
  if (!labTestType) return '';
  
  const referenceRange = getReferenceRange(labTestType, sex);
  const { unit } = labTestType;
  if (!unit) return referenceRange;
  if (referenceRange === 'n/a') return referenceRange;
  return `${referenceRange} ${unit}`;
};
