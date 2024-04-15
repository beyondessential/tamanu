import { useLocalisation } from '../contexts/Localisation';
import { SEX_OPTIONS } from '@tamanu/constants';

export const useSexValues = () => {
  const { getLocalisation } = useLocalisation();
  const sexValues = SEX_OPTIONS.map(o => o.value);

  if (getLocalisation('features.hideOtherSex') === true) {
    return sexValues.filter(s => s !== 'other');
  }

  return sexValues;
};

export const useSexOptions = (includeAll = false) => {
  const { getLocalisation } = useLocalisation();
  const options =
    getLocalisation('features.hideOtherSex') === true
      ? SEX_OPTIONS.filter(s => s.value !== 'other')
      : SEX_OPTIONS;

  return [...(includeAll ? [{ value: '', label: 'All' }] : []), ...options];
};
