import React, { ReactElement } from 'react';
import { useLocalisation } from '~/ui/contexts/LocalisationContext';

type LocalisedTextProps = {
  path: string;
}

export const LocalisedText = ({ path }: LocalisedTextProps): ReactElement => {
  const { getString } = useLocalisation();
  if (!path) {
    if (__DEV__) {
      throw new Error(`ConfigurableText: missing path!`);
    }
    return <>{'no path specified'}</>;
  }
  return <>{getString(path)}</>;
};
