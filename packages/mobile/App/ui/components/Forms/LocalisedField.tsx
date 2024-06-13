import React from 'react';

import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { Field, FieldProps } from './FormField';

type LocalisedFieldProps = FieldProps & {
  localisationPath?: string;
};

export const LocalisedField = ({ name, label, ...props }: LocalisedFieldProps): JSX.Element => {
  const { getBool } = useLocalisation();
  const isHidden = getBool(`fields.${name}.hidden`);
  if (isHidden) {
    return null;
  }
  return <Field {...props} name={name} label={label} />;
};
