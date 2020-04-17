import React, { ReactElement } from 'react';
import { theme } from '/styled/theme';
import {
  StyledTouchableOpacity,
  StyledSafeAreaView,
  RowView,
  StyledText,
} from '/styled/common';
import { LeftArrow } from '/components/Icons';
import { Orientation, screenPercentageToDP } from '/helpers/screen';

type HeaderProps = {
  onGoBack: () => void;
};

export const Header = ({ onGoBack }: HeaderProps): ReactElement => {
  return (
    <StyledSafeAreaView background={theme.colors.PRIMARY_MAIN}>
      <RowView height={70}>
        <StyledTouchableOpacity
          onPress={onGoBack}
          padding={screenPercentageToDP(2.46, Orientation.Height)}
        >
          <LeftArrow />
        </StyledTouchableOpacity>
        <RowView
          position="absolute"
          alignItems="center"
          justifyContent="center"
          width="100%"
          zIndex={-1}
          height={70}
        >
          <StyledText color={theme.colors.WHITE} fontSize={16}>
            Register New Patient
          </StyledText>
        </RowView>
      </RowView>
    </StyledSafeAreaView>
  );
};
