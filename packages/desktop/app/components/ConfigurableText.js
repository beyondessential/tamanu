import { React } from 'react';

import { useFlags } from '../contexts/FeatureFlags';

export ConfigurableText = ({ key }) => {
  const { getFlag } = useFlags();

  if (!key) {
    return '<no key specified>';
  }
  const value = getFlag(key);
  if (typeof value !== 'string') {
    return `<key not set to text: ${key}>`;
  }
  return `${getFlag(key)}`;
};
