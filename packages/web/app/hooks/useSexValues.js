import { useLocalisation } from '../contexts/Localisation';
import { sexOptions } from '../constants';

export const useSexValues = () => {
  const { getLocalisation } = useLocalisation();
  const sexValues = sexOptions.map(o => o.value);

  if (getLocalisation('features.hideOtherSex') === true) {
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
