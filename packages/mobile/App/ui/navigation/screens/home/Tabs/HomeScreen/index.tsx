import React, { ReactElement, useCallback, useEffect } from 'react';
import { StatusBar } from 'react-native';
import { compose } from 'redux';
import { RecentlyViewedPatientTiles } from './RecentlyViewedPatientTiles';
import { LogoV2Icon, SearchIcon } from '/components/Icons';
import { UserAvatar } from '/components/UserAvatar';
import { withAuth } from '/containers/Auth';
import { useAuth } from '~/ui/contexts/AuthContext';
import { useFacility } from '~/ui/contexts/FacilityContext';
import { disableAndroidBackButton } from '/helpers/android';
import { Routes } from '/helpers/routes';
import { Orientation, screenPercentageToDP, setStatusBar } from '/helpers/screen';
import { BaseAppProps } from '/interfaces/BaseAppProps';
import {
  FullView,
  RowView,
  StyledSafeAreaView,
  StyledText,
  StyledTouchableOpacity,
  StyledView,
} from '/styled/common';
import { theme } from '/styled/theme';

import { ConditionalRegisterPatientButton } from './RegisterPatientButton';
import { SyncInactiveAlert } from '~/ui/components/SyncInactiveAlert';

const SearchPatientsButton = ({ onPress }: { onPress: () => void }): ReactElement => (
  <StyledTouchableOpacity testID="search-patients-button" onPress={onPress}>
    <RowView
      borderRadius={50}
      paddingLeft={20}
      background={theme.colors.WHITE}
      height={screenPercentageToDP(6.07, Orientation.Height)}
      alignItems="center"
    >
      <SearchIcon fill={theme.colors.TEXT_MID} />
      <StyledText
        fontSize={screenPercentageToDP(1.94, Orientation.Height)}
        marginLeft={10}
        color={theme.colors.TEXT_MID}
      >
        Search for patients
      </StyledText>
    </RowView>
  </StyledTouchableOpacity>
);

const BaseHomeScreen = ({ navigation, user }: BaseAppProps): ReactElement => {
  disableAndroidBackButton();
  const { checkFirstSession, setUserFirstSignIn } = useAuth();
  const { facilityName } = useFacility();

  useEffect(() => {
    if (checkFirstSession()) {
      setUserFirstSignIn();
    }
  }, []);

  const onNavigateToSearchPatient = useCallback(() => {
    navigation.navigate(Routes.HomeStack.SearchPatientStack.Index);
  }, []);

  setStatusBar('light-content', theme.colors.PRIMARY_MAIN);

  if (!user) {
    // This is only encountered in situations where it's about to immediately
    // get redirected away -- fine to show a blank screen.
    return null;
  }

  return (
      <StyledSafeAreaView flex={1} background={theme.colors.PRIMARY_MAIN}>
        <FullView>
          <StatusBar barStyle="light-content" />
          <StyledView
            height="31.59%"
            width="100%"
            paddingRight={screenPercentageToDP(6.08, Orientation.Width)}
            paddingLeft={screenPercentageToDP(6.08, Orientation.Width)}
          >
            <StyledView width="100%">
              <RowView
                alignItems="center"
                marginTop={screenPercentageToDP(1.21, Orientation.Height)}
                width="100%"
                justifyContent="space-between"
              >
                <LogoV2Icon height={23} width={95} fill={theme.colors.WHITE} />
                <UserAvatar
                  size={screenPercentageToDP(5.46, Orientation.Height)}
                  displayName={user.displayName}
                  sex={user.gender}
                />
              </RowView>
              <StyledText
                marginTop={screenPercentageToDP(3.07, Orientation.Height)}
                fontSize={screenPercentageToDP(4.86, Orientation.Height)}
                fontWeight="bold"
                color={theme.colors.WHITE}
              >
                Hi {user.displayName}
              </StyledText>
              <StyledText
                fontSize={screenPercentageToDP(2.18, Orientation.Height)}
                color={theme.colors.WHITE}
              >
                {facilityName}
              </StyledText>
            </StyledView>
          </StyledView>
          <StyledView
            zIndex={2}
            position="absolute"
            paddingLeft={screenPercentageToDP(4.86, Orientation.Width)}
            paddingRight={screenPercentageToDP(4.86, Orientation.Width)}
            top="28%"
            width="100%"
          >
            <SearchPatientsButton onPress={onNavigateToSearchPatient} />
          </StyledView>
          <ConditionalRegisterPatientButton />
          <RecentlyViewedPatientTiles />
          <StyledView background={theme.colors.BACKGROUND_GREY}>
            <SyncInactiveAlert />
          </StyledView>
        </FullView>
      </StyledSafeAreaView>
  );
};

export const HomeScreen = compose(withAuth)(BaseHomeScreen);
