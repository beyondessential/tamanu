import React, { useContext } from 'react';

import AuthContext from '~/ui/contexts/AuthContext';

import { StyledView } from '/styled/common';
import { Field } from '../FormField';
import { TextField } from '../../TextField/TextField';

export const UserDataField = ({ name, config, defaultText }) => {
  const { user } = useContext(AuthContext);

  return (
    <StyledView marginTop={10}>
      <Field
        component={TextField}
        name={name}
        label={defaultText}
        value={user[config.column]}
        disabled
      />
    </StyledView>
  );
}
