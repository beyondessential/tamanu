import React from 'react';
import { StyledText } from '~/ui/styled/common';

export const ReadOnlyField = ({ name, value }) => {
  if(!value && value !== 0) {
    return (<StyledText>N/A</StyledText>);
  }

  return <StyledText>{value}</StyledText>;
};
