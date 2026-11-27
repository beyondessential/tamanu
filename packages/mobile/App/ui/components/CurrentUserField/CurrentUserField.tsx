import React from 'react';

import { useAuth } from '~/ui/contexts/AuthContext';
import { Field } from '../Forms/FormField';
import { TextField } from '../TextField/TextField';
import type { TranslatedTextElement } from '../Translations/TranslatedText';

interface CurrentUserFieldProps {
  name: string;
  label: TranslatedTextElement;
  labelFontSize: string;
  valueKey?: string;
}

export const CurrentUserField = ({
  name,
  label,
  labelFontSize,
  valueKey = 'displayName',
}: CurrentUserFieldProps) => {
  const { user } = useAuth();

  return (
    <Field
      component={TextField}
      name={name}
      label={label}
      labelFontSize={labelFontSize}
      value={user[valueKey]}
      disabled
    />
  );
};
