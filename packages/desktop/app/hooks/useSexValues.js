import { useFeatureFlag } from '../contexts/Localisation';
import { sexOptions } from '../constants';

export const useSexValues = () => {
  const hideOtherSexFeature = useFeatureFlag('hideOtherSex');
  const sexValues = sexOptions.map(o => o.value);

  if (hideOtherSexFeature === true) {
    return sexValues.filter(s => s !== 'other');
  }

  return sexValues;
};

export const useSexOptions = (includeAll = false) => {
  const hideOtherSexFeature = useFeatureFlag('hideOtherSex');
  const options =
    hideOtherSexFeature === true ? sexOptions.filter(s => s.value !== 'other') : sexOptions;

  return [...(includeAll ? [{ value: '', label: 'All' }] : []), ...options];
};
