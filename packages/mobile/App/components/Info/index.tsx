import React, { FunctionComponent } from 'react';
import { StyledText, RowView, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { Alert } from '../Icons';

interface InfoProps {
    text: string;
}

export const Info: FunctionComponent<InfoProps> = ({ text }: InfoProps) => (
  <RowView
    height={screenPercentageToDP('5.83', Orientation.Height)}
    width={screenPercentageToDP('90.02', Orientation.Width)}
    background={theme.colors.LIGHT_SECONDARY}
    justifyContent="center"
    alignItems="center"
    borderWidth={1}
    borderColor={theme.colors.SECONDARY_MAIN}
  >
    <StyledView
      marginRight={10}
    >
      <Alert />
    </StyledView>
    <StyledText
      fontSize={screenPercentageToDP('1.57', Orientation.Height)}
      color={theme.colors.PRIMARY_MAIN}
    >{text}
    </StyledText>
  </RowView>
);
