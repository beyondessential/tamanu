import React from 'react';
import { StyledText } from '~/ui/styled/common';

export const ReadOnlyField = ({ name, value }: { name: string, value: any }) => {
  if(typeof value === "number") {
    return <StyledText>{value.toFixed(2)}</StyledText>;
  }
  
  if(!value) {
    return <StyledText color="#aaa">N/A</StyledText>;
  }

  return <StyledText>{value}</StyledText>;
};
