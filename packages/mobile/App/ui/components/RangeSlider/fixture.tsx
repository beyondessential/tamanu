import React, { useState } from 'react';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { StyledView, StyledText, RowView } from '/styled/common';
import { AgeRangeSlider } from './index';

export const BaseStory = (): Element => {
  const [value, setValue] = useState([32, 46]);

  return (
    <StyledView>
      <StyledView alignItems="center">
        <StyledText color="white" fontSize={35}>
          Age Range
        </StyledText>
        <RowView width="100%" justifyContent="center">
          <StyledText fontSize={20} color="white" marginRight={40}>
            {value[0]}
          </StyledText>
          <StyledText fontSize={20} color="white">
            {value[1]}
          </StyledText>
        </RowView>
      </StyledView>
      <AgeRangeSlider
        min={0}
        max={110}
        rangeStart={value[0]}
        rangeEnd={value[1]}
        onChange={setValue}
        width={screenPercentageToDP('90.02', Orientation.Width)}
      />
    </StyledView>
  );
};
