import React from 'react';

import { useTranslation } from '~/ui/contexts/TranslationContext';
import { Field, FieldProps } from './FormField';
import { useSettings } from '~/ui/contexts/SettingsContext';

type LocalisedFieldProps = FieldProps & {
  path?: string;
};

export const LocalisedField = ({
  name,
  label,
  path,
  ...props
}: LocalisedFieldProps): JSX.Element => {
  const { getSetting } = useSettings();
  const { getTranslation } = useTranslation();

  const isHidden = getSetting<boolean>(`localisation.fields.${path || name}.hidden`);
  if (isHidden) {
    return null;
  }
  return (
    <Field
      {...props}
      label={label || getTranslation(`general.localisedField.${path || name}.label`)}
      name={name}
    />
  );
};
