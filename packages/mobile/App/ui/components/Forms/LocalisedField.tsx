import React from 'react';

import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { Field, FieldProps } from './FormField';

type LocalisedFieldProps = FieldProps & {
  localisationPath?: string;
};

export const LocalisedField = ({
  name,
  localisationPath = `fields.${name}`,
  ...props
}: LocalisedFieldProps): JSX.Element => {
  const { getString, getBool } = useLocalisation();

  const isHidden = getBool(`${localisationPath}.hidden`);
  if (isHidden) {
    return null;
  }
  const label = getString(`${localisationPath}.longLabel`);
  return <Field {...props} name={name} label={label} />;
};
