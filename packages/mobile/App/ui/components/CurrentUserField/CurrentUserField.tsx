import React from 'react';
import { useSelector } from 'react-redux';

import { authUserSelector } from '~/ui/helpers/selectors';
import { Field } from '../Forms/FormField';
import { TextField } from '../TextField/TextField';

export const CurrentUserField = ({ name, label = null, valueKey = 'displayName' }) => {
  const user = useSelector(authUserSelector);

  return (
    <Field
      component={TextField}
      name={name}
      label={label}
      value={user[valueKey]}
      disabled
    />
  );
};
