import { React } from 'react';

import { useFlags } from '../contexts/FeatureFlags';

export const ConfigurableText = ({ flag }) => {
  const { getFlag } = useFlags();
  if (!flag) {
    return '<no flag specified>';
  }
  const value = getFlag(flag);
  if (typeof value !== 'string') {
    return `<flag not set to text: ${flag}>`;
  }
  return `${getFlag(flag)}`;
};
