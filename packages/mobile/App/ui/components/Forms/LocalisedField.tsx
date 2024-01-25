import React from 'react';

import { useSettings } from '~/ui/contexts/SettingContext';
import { Field, FieldProps } from './FormField';

type LocalisedFieldProps = FieldProps & {
  localisationPath?: string;
};

export const LocalisedField = ({
  name,
  localisationPath = `fields.${name}`,
  ...props
}: LocalisedFieldProps): JSX.Element => {
  const { getSetting } = useSettings();

  const isHidden = getSetting<boolean>(`${localisationPath}.hidden`);
  if (isHidden) {
    return null;
  }
  const label = getSetting<string>(`${localisationPath}.longLabel`);
  return <Field {...props} name={name} label={label} />;
};
