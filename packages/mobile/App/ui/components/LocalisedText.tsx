import React, { ReactElement } from 'react';
import { useSettings } from '~/ui/contexts/SettingContext';

type LocalisedTextProps = {
  path: string;
};

export const LocalisedText = ({ path }: LocalisedTextProps): ReactElement => {
  const { getSetting } = useSettings();
  if (!path) {
    if (__DEV__) {
      throw new Error(`ConfigurableText: missing path!`);
    }
    return <>{'no path specified'}</>;
  }
  return <>{getSetting<string>(path)}</>;
};
