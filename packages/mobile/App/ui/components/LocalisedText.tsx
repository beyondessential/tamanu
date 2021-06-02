import React, { ReactElement } from 'react';
import { useLocalisation } from '~/ui/contexts/LocalisationContext';

type LocalisedTextProps = {
  path: string;
}

export const LocalisedText = ({ path }: LocalisedTextProps): ReactElement => {
  const { getLocalisation } = useLocalisation();
  if (!path) {
    if (__DEV__) {
      throw new Error(`ConfigurableText: missing path!`);
    }
    return <>{'no path specified'}</>;
  }
  const value = getLocalisation(path);
  if (typeof value !== 'string') {
    return <>{`<path not set to text: ${path}>`}</>;
  }
  return <>{value}</>;
};
