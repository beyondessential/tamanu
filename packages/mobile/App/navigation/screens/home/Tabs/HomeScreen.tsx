import React, { ReactElement, useCallback } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { StatusBar } from 'react-native';
import {
  FullView,
  StyledText,
  StyledView,
  StyledTouchableOpacity,
  RowView,
  StyledSafeAreaView,
} from '/styled/common';
import { Profile, LogoV2CLR, Search as SearchIcon } from '/components/Icons';
import { PatientCard } from '/components/PatientCard';
import { theme } from '/styled/theme';
import { disableAndroidBackButton } from '/helpers/android';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { UserAvatar } from '/components/UserAvatar';
import { Genders } from '/helpers/user';
import { Routes } from '/helpers/routes';
import { BaseAppProps } from '/interfaces/BaseAppProps';
import { FemaleGender } from '/root/App/helpers/constants';

const placeholderPatient = {
  city: 'Mbelagha',
  name: 'Ugyen Wangdi',
  // enums like gender should use the value, not the label - PatientCard should
  // be responsible for displaying this correctly
  gender: FemaleGender.value,
  age: '34',
  image:
    'https://res.cloudinary.com/dqkhy63yu/image/upload/v1573676957/Ellipse_4.png',
  lastVisit: new Date(),
};

const HomeMenuButton = ({ text }: { text: string }): ReactElement => (
  <StyledTouchableOpacity onPress={(): void => console.log('home menu')}>
    <StyledView
      height={screenPercentageToDP(23.08, Orientation.Height)}
      width={screenPercentageToDP(43.79, Orientation.Width)}
      background={theme.colors.WHITE}
      paddingLeft={15}
      paddingTop={25}
    >
      <Profile size={screenPercentageToDP(6.92, Orientation.Height)} />
      <StyledText
        lineHeight={screenPercentageToDP(2.67, Orientation.Height)}
        marginTop={screenPercentageToDP(4.86, Orientation.Width)}
        fontSize={18}
        fontWeight="bold"
        color={theme.colors.TEXT_DARK}
      >
        {text}
      </StyledText>
    </StyledView>
  </StyledTouchableOpacity>
);

const PatientCardContainer = (): ReactElement => (
  <StyledView marginRight={10}>
    <PatientCard
      onPress={(): void => console.log('patient card.')}
      {...placeholderPatient}
    />
  </StyledView>
);

const SearchPatientsButton = ({
  onPress,
}: {
  onPress: () => void;
}): ReactElement => (
  <StyledTouchableOpacity onPress={onPress}>
    <RowView
      borderRadius={50}
      paddingLeft={20}
      background={theme.colors.WHITE}
      height={50}
      alignItems="center"
    >
      <SearchIcon fill={theme.colors.TEXT_MID} />
      <StyledText fontSize={16} marginLeft={10} color={theme.colors.TEXT_MID}>
        Search for patients
      </StyledText>
    </RowView>
  </StyledTouchableOpacity>
);

export const HomeScreen = ({ navigation }: BaseAppProps): ReactElement => {
  disableAndroidBackButton();

  const onNavigateToSearchPatient = useCallback(() => {
    navigation.navigate(Routes.HomeStack.SearchPatientStack.name);
  }, []);

  const currentUser = {
    firstName: 'Tony',
    lastName: 'Robbins',
  };

  return (
    <FullView background={theme.colors.PRIMARY_MAIN}>
      <StatusBar barStyle="light-content" />
      <StyledView
        height={screenPercentageToDP(31.59, Orientation.Height)}
        width="100%"
        paddingRight={screenPercentageToDP(6.08, Orientation.Width)}
        paddingLeft={screenPercentageToDP(6.08, Orientation.Width)}
      >
        <StyledSafeAreaView width="100%">
          <RowView
            alignItems="center"
            marginTop={10}
            width="100%"
            justifyContent="space-between"
          >
            <LogoV2CLR fill={theme.colors.WHITE} />
            <UserAvatar
              size={screenPercentageToDP(5.46, Orientation.Height)}
              name="Tony Robbins"
              gender={Genders.MALE}
            />
          </RowView>
          <StyledText
            marginTop={screenPercentageToDP(3.07, Orientation.Height)}
            fontSize={screenPercentageToDP(4.86, Orientation.Height)}
            fontWeight="bold"
            color={theme.colors.WHITE}
          >
            Hi {currentUser.firstName}
          </StyledText>
          <StyledText
            fontSize={screenPercentageToDP(2.18, Orientation.Height)}
            color={theme.colors.WHITE}
          >
            Hospital name
          </StyledText>
        </StyledSafeAreaView>
      </StyledView>
      <StyledView
        zIndex={2}
        position="absolute"
        paddingLeft={screenPercentageToDP(4.86, Orientation.Width)}
        paddingRight={screenPercentageToDP(4.86, Orientation.Width)}
        top="31.7%"
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
          <HomeMenuButton text="Anonymous Patient" />
          <HomeMenuButton text={'Register\nNew Patient'} />
        </RowView>
      </StyledView>
      <StyledView
        flex={1}
        background={theme.colors.BACKGROUND_GREY}
        paddingLeft={screenPercentageToDP(4.86, Orientation.Width)}
      >
        <StyledText
          color={theme.colors.TEXT_DARK}
          fontSize={12}
          marginBottom={10}
        >
          RECENT VIEWED PATIENTS
        </StyledText>
        <ScrollView horizontal>
          <RowView flex={1}>
            <PatientCardContainer />
            <PatientCardContainer />
            <PatientCardContainer />
          </RowView>
        </ScrollView>
      </StyledView>
    </FullView>
  );
};
