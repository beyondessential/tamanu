import React from 'react';

import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { Field, FieldProps } from './FormField';

type LocalisedFieldProps = FieldProps & {
  defaultLabel?: string;
  path?: string;
};

export const LocalisedField = ({
  name,
  defaultLabel,
  path = `fields.${name}`,
  ...props
}: LocalisedFieldProps): JSX.Element => {
  const { getString, getBool } = useLocalisation();

  const isHidden = getBool(`${path}.hidden`);
  if (isHidden) {
    return null;
  }
  const label = getString(`${path}.longLabel`, defaultLabel);
  return <Field {...props} name={name} label={label} />;
};
