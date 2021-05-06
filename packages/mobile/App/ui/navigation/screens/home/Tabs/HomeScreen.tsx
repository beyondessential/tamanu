import React, { ReactElement, useCallback, useContext, useEffect } from 'react';
import { StatusBar } from 'react-native';
import { compose } from 'redux';
import { RecentlyViewedPatientTiles } from './RecentlyViewedPatientTiles';
import { LogoV2Icon, ProfileIcon, SearchIcon } from '/components/Icons';
import { UserAvatar } from '/components/UserAvatar';
import { withAuth } from '/containers/Auth';
import AuthContext from '~/ui/contexts/AuthContext';
import { disableAndroidBackButton } from '/helpers/android';
import { Routes } from '/helpers/routes';
import {
  Orientation,
  screenPercentageToDP,
  setStatusBar,
} from '/helpers/screen';
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

const HomeMenuButton = ({
  text,
  onPress,
}: {
  text: string;
  onPress: () => void;
}): ReactElement => (
  <StyledTouchableOpacity onPress={onPress}>
    <StyledView
      height={screenPercentageToDP(23.08, Orientation.Height)}
      width={screenPercentageToDP(43.79, Orientation.Width)}
      background={theme.colors.WHITE}
      borderRadius={5}
      paddingLeft={15}
      paddingTop={screenPercentageToDP(3.03, Orientation.Height)}
    >
      <ProfileIcon
        height={screenPercentageToDP(6.92, Orientation.Height)}
        width={screenPercentageToDP(6.92, Orientation.Height)}
      />
      <StyledText
        lineHeight={screenPercentageToDP(2.67, Orientation.Height)}
        marginTop={screenPercentageToDP(4.86, Orientation.Width)}
        fontSize={screenPercentageToDP(2.18, Orientation.Height)}
        fontWeight="bold"
        color={theme.colors.TEXT_DARK}
      >
        {text}
      </StyledText>
    </StyledView>
  </StyledTouchableOpacity>
);

const SearchPatientsButton = ({
  onPress,
}: {
  onPress: () => void;
}): ReactElement => (
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
  const authCtx = useContext(AuthContext);
  useEffect(() => {
    if (authCtx.checkFirstSession()) {
      authCtx.setUserFirstSignIn();
    }
  }, []);

  const onNavigateToSearchPatient = useCallback(() => {
    navigation.navigate(Routes.HomeStack.SearchPatientStack.Index);
  }, []);

  const onNavigateToRegisterPatient = useCallback(() => {
    navigation.navigate(Routes.HomeStack.RegisterPatientStack.Index);
  }, []);

  setStatusBar('light-content', theme.colors.PRIMARY_MAIN);

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
                displayName={user && user.displayName}
                gender={user && user.gender}
              />
            </RowView>
            <StyledText
              marginTop={screenPercentageToDP(3.07, Orientation.Height)}
              fontSize={screenPercentageToDP(4.86, Orientation.Height)}
              fontWeight="bold"
              color={theme.colors.WHITE}
            >
              Hi {user && user.displayName}
            </StyledText>
            <StyledText
              fontSize={screenPercentageToDP(2.18, Orientation.Height)}
              color={theme.colors.WHITE}
            >
              {user.facility.name}
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
        <StyledView
          background={theme.colors.BACKGROUND_GREY}
          paddingTop={screenPercentageToDP(4.86, Orientation.Height)}
          paddingBottom={screenPercentageToDP(3.03, Orientation.Height)}
          paddingLeft={screenPercentageToDP(4.86, Orientation.Width)}
          paddingRight={screenPercentageToDP(4.86, Orientation.Width)}
        >
          <RowView width="100%" justifyContent="space-between">
            <HomeMenuButton
              onPress={onNavigateToRegisterPatient}
              text={'Register\nNew Patient'}
            />
          </RowView>
        </StyledView>
        <RecentlyViewedPatientTiles />
      </FullView>
    </StyledSafeAreaView>
  );
};

export const HomeScreen = compose(withAuth)(BaseHomeScreen);
