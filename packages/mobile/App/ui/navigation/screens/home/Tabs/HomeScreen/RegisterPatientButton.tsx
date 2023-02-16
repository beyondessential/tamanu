import React, { ReactElement, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { theme } from '/styled/theme';
import { ProfileIcon } from '/components/Icons';
import {
  Orientation,
  screenPercentageToDP,
} from '/helpers/screen';
import {
  RowView,
  StyledText,
  StyledTouchableOpacity,
  StyledView,
} from '/styled/common';
import { Routes } from '/helpers/routes';

const RegisterPatientButton = (): ReactElement => {
  const navigation = useNavigation();
  const onNavigateToRegisterPatient = useCallback(() => {
    navigation.navigate(Routes.HomeStack.RegisterPatientStack.Index);
  }, []);

  return (
    <StyledView
      background={theme.colors.BACKGROUND_GREY}
      paddingTop={screenPercentageToDP(4.86, Orientation.Height)}
      paddingBottom={screenPercentageToDP(3.03, Orientation.Height)}
      paddingLeft={screenPercentageToDP(4.86, Orientation.Width)}
      paddingRight={screenPercentageToDP(4.09, Orientation.Width)}
    >
      <RowView width="100%" justifyContent="space-between">
        <StyledTouchableOpacity onPress={onNavigateToRegisterPatient}>
          <StyledView
            height={screenPercentageToDP(21.08, Orientation.Height)}
            width={screenPercentageToDP(40.79, Orientation.Width)}
            background={theme.colors.WHITE}
            borderRadius={5}
            paddingLeft={15}
            paddingTop={screenPercentageToDP(3.03, Orientation.Height)}
          >
            <ProfileIcon
              style={{
                height: screenPercentageToDP(6.92, Orientation.Height),
                width: screenPercentageToDP(6.92, Orientation.Height),
              }}
            />
            <StyledText
              lineHeight={screenPercentageToDP(2.67, Orientation.Height)}
              marginTop={screenPercentageToDP(4.86, Orientation.Width)}
              fontSize={screenPercentageToDP(2.18, Orientation.Height)}
              fontWeight="bold"
              color={theme.colors.TEXT_DARK}
            >
              {'Register\nNew Patient'}
            </StyledText>
          </StyledView>
        </StyledTouchableOpacity>
      </RowView>
    </StyledView>
  );
};

export const ConditionalRegisterPatientButton = (): ReactElement => {
  const { getBool } = useLocalisation();
  const allowRegisterPatient = getBool('features.registerNewPatient');
  if (allowRegisterPatient) {
    return <RegisterPatientButton />;
  }
  // Prevent view collapsing strangely
  return (
    <StyledView
      background={theme.colors.BACKGROUND_GREY}
      paddingTop={screenPercentageToDP(4.86, Orientation.Height)}
      paddingBottom={screenPercentageToDP(3.03, Orientation.Height)}
      paddingLeft={screenPercentageToDP(4.86, Orientation.Width)}
      paddingRight={screenPercentageToDP(4.86, Orientation.Width)}
    />
  );
};
