import { SEX_OPTIONS } from '@tamanu/constants';
import { useSettings } from '../contexts/Settings';

export const useSexValues = () => {
  const { getSetting } = useSettings();
  const sexValues = SEX_OPTIONS.map((o) => o.value);

  if (getSetting('features.hideOtherSex') === true) {
    return sexValues.filter((s) => s !== 'other');
  }

  return sexValues;
};

export const useSexOptions = (includeAll = false) => {
  const { getSetting } = useSettings();
  const options =
    getSetting('features.hideOtherSex') === true
      ? SEX_OPTIONS.filter((s) => s.value !== 'other')
      : SEX_OPTIONS;

  return [...(includeAll ? [{ value: '', label: 'All' }] : []), ...options];
};
