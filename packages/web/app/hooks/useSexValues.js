import { useSettings } from '../contexts/Settings';
import { SEX_OPTIONS } from '@tamanu/constants';

export const useSexValues = () => {
  const { getSetting } = useSettings();
  const sexValues = SEX_OPTIONS.map(o => o.value);

  const hideOtherSex = getSetting('features.hideOtherSex');
  if (hideOtherSex) {
    return sexValues.filter(s => s !== 'other');
  }

  return sexValues;
};

export const useSexOptions = (includeAll = false) => {
  const { getSetting } = useSettings();
  const hideOtherSex = getSetting('features.hideOtherSex');
  const options = hideOtherSex ? SEX_OPTIONS.filter(s => s.value !== 'other') : sexOptions;

  return [...(includeAll ? [{ value: '', label: 'All' }] : []), ...options];
};
