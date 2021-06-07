import React from 'react';

import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { Field, FieldProps } from './FormField';

type LocalisedFieldProps = FieldProps & {
  path?: string;
};

export const LocalisedField = ({
  name,
  path = `fields.${name}`,
  ...props
}: LocalisedFieldProps): JSX.Element => {
  const { getString, getBool } = useLocalisation();

  const isHidden = getBool(`${path}.hidden`);
  if (isHidden) {
    return null;
  }
  const label = getString(`${path}.longLabel`);
  return <Field {...props} name={name} label={label} />;
};
