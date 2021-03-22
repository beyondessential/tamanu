import React from 'react';

import { StyledView } from '/styled/common';
import { CurrentUserField } from '../../CurrentUserField/CurrentUserField';

export const UserDataField = ({ name, config, defaultText }) => (
  <StyledView marginTop={10}>
    <CurrentUserField
      name={name}
      label={defaultText}
      valueKey={config.column}
    />
  </StyledView>
);
