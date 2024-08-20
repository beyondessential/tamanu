import React from 'react';

import { useTranslation } from '~/ui/contexts/TranslationContext';
import { Field, FieldProps } from './FormField';
import { useSettings } from '~/ui/contexts/SettingsContext';

type LocalisedFieldProps = FieldProps & {
  localisationPath?: string;
};

export const LocalisedField = ({ name, label, ...props }: LocalisedFieldProps): JSX.Element => {
  const { getSetting } = useSettings();
  const { getTranslation } = useTranslation();

  const isHidden = getSetting<boolean>(`localisation.fields.${name}.hidden`);
  if (isHidden) {
    return null;
  }
  return (
    <Field
      {...props}
      label={label || getTranslation(`general.localisedField.${name}.label`)}
      name={name}
    />
  );
};
