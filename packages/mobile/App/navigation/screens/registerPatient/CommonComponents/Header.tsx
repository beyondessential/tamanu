import React, { useCallback, ReactElement } from 'react';
import { theme } from '/root/App/styled/theme';
import {
  StyledTouchableOpacity,
  StyledSafeAreaView,
  RowView,
  StyledText,
} from '/root/App/styled/common';
import { LeftArrow } from '/root/App/components/Icons';
import { Orientation, screenPercentageToDP } from '/root/App/helpers/screen';
import { useNavigation } from '@react-navigation/native';

export const Header = (): ReactElement => {
  const navigation = useNavigation();
  const onPress = useCallback(() => {
    navigation.goBack();
  }, []);

  return (
    <StyledSafeAreaView background={theme.colors.PRIMARY_MAIN}>
      <RowView height={70}>
        <StyledTouchableOpacity
          onPress={onPress}
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
