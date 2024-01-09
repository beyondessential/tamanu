import React from 'react';
import { screenPercentageToDP, Orientation } from '~/ui/helpers/screen';
import { StyledText } from '~/ui/styled/common';

const getValueToDisplay = value => {
  if(typeof value === "number") return value.toFixed(1);
  if(!value) return 'N/A';
  return value;
}

export const ReadOnlyField = ({ name, value }: { name: string, value: any }) => {
  const styleProps = {
    color: value ? '#000' : '#aaa',
    fontSize: screenPercentageToDP('2.2', Orientation.Height),
  }

  return <StyledText {...styleProps}>{getValueToDisplay(value)}</StyledText>;
};
