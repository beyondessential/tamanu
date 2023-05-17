import React from 'react';
import { useSelector } from 'react-redux';

import { authUserSelector } from '~/ui/helpers/selectors';
import { Field } from '../Forms/FormField';
import { TextField } from '../TextField/TextField';

interface CurrentUserFieldProps {
  name: string,
  label: string,
  labelFontSize: string,
  valueKey?: string,
}

export const CurrentUserField = ({
  name,
  label,
  labelFontSize,
  valueKey = 'displayName',
}: CurrentUserFieldProps): JSX.Element => {
  const user = useSelector(authUserSelector);

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
