import React from 'react';
import { StyledText, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { TranslatedText } from '/components/Translations/TranslatedText';

export const VitalsTableTitle = (): JSX.Element => (
  <StyledView
    background={theme.colors.WHITE}
    width={screenPercentageToDP(31.63, Orientation.Width)}
    height={screenPercentageToDP(6.86, Orientation.Height)}
    borderBottomWidth={1}
    borderRightWidth={1}
    borderColor={theme.colors.BOX_OUTLINE}
    justifyContent="center"
    paddingLeft={screenPercentageToDP(3.64, Orientation.Width)}
  >
    <StyledText
      fontSize={screenPercentageToDP(1.6, Orientation.Height)}
      fontWeight={500}
      color="#326699"
    >
      <TranslatedText stringId="vitals.table.column.header.measure" fallback="Measure" />
    </StyledText>
  </StyledView>
);
