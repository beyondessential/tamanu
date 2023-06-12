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
