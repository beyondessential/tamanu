import React from 'react';

import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { Field, FieldProps } from './FormField';

type LocalisedFieldProps = FieldProps & {
  localisationPath?: string;
};

export const LocalisedField = ({
  name,
  ...props
}: LocalisedFieldProps): JSX.Element => {
  const { getBool } = useLocalisation();
  const { getTranslation } = useTranslation();

  const isHidden = getBool(`fields.${name}.hidden`);
  if (isHidden) {
    return null;
  }
  const label = getTranslation(`general.localisedField.${name}.label`);
  return <Field {...props} name={name} label={label} />;
};
