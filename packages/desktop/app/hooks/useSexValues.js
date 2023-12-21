import { useSettings } from '../contexts/Settings';
import { sexOptions } from '../constants';

export const useSexValues = () => {
  const { getSetting } = useSettings();
  const sexValues = sexOptions.map(o => o.value);

  const hideOtherSex = getSetting('features.hideOtherSex');
  if (hideOtherSex) {
    return sexValues.filter(s => s !== 'other');
  }

  return sexValues;
};

export const useSexOptions = (includeAll = false) => {
  const { getLocalisation } = useLocalisation();
  const options =
    getLocalisation('features.hideOtherSex') === true
      ? sexOptions.filter(s => s.value !== 'other')
      : sexOptions;

  return [...(includeAll ? [{ value: '', label: 'All' }] : []), ...options];
};
