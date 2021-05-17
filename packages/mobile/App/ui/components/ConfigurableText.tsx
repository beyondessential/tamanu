import React, { ReactElement } from 'react';
import { useFlags } from '~/ui/contexts/FeatureFlagsContext';

type ConfigurableTextProps = {
  flag: string;
}

export const ConfigurableText = ({ flag }: ConfigurableTextProps): ReactElement => {
  const { getFlag } = useFlags();
  if (!flag) {
    if (__DEV__) {
      throw new Error(`ConfigurableText: missing flag!`);
    }
    return <>{'no flag specified'}</>;
  }
  const value = getFlag(flag);
  if (typeof value !== 'string') {
    return <>{`<flag not set to text: ${flag}>`}</>;
  }
  return <>{`${getFlag(flag)}`}</>;
};
