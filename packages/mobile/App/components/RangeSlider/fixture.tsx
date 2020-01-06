import React, { useState } from 'react';
import { AgeRangeSlider } from './index';
import { screenPercentageToDP, Orientation } from '../../helpers/screen';
import { StyledView, StyledText, RowView } from '../../styled/common';

export const BaseStory = () => {
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
        onChangeValue={setValue}
        width={screenPercentageToDP('90.02', Orientation.Width)}
      />
    </StyledView>
  );
};
