import React, { ReactElement, useCallback } from 'react';
import {
  FullView,
  RowView,
  StyledText,
  StyledSafeAreaView,
  StyledView,
} from '/styled/common';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { Button } from '/components/Button';
import { CrossIcon, GivenOnTimeIcon } from '/components/Icons';
import { Routes } from '/helpers/routes';
import { UserAvatar } from '/components/UserAvatar';
import { compose } from 'redux';
import { withPatient } from '/containers/Patient';
import { IPatient } from '~/types';
import { FemaleGender } from '/helpers/constants';
import { NewPatientScreenProps } from '/interfaces/screens/RegisterPatientStack/NewPatientScreenProps';

const mockPatientData = {
  name: 'Alice Klein',
  gender: 'female',
  age: 34,
  city: 'Flemington',
};

const newPatientAddedMock = {
  size: screenPercentageToDP('16.40', Orientation.Height),
  displayName: 'Alice Klein',
  gender: 'female',
  image:
    'https://res.cloudinary.com/dqkhy63yu/image/upload/v1573676957/Ellipse_4.png',
  Icon: (
    <StyledView position="absolute" right="-20" bottom={30} zIndex={2}>
      <GivenOnTimeIcon
        size={screenPercentageToDP('3.88', Orientation.Height)}
      />
    </StyledView>
  ),
};

const Screen = ({
  navigation,
  setSelectedPatient,
}: NewPatientScreenProps): ReactElement => {
  const onNavigateToHome = useCallback(() => {
    navigation.navigate(Routes.HomeStack.HomeTabs.Index);
  }, []);

  const onAddAnotherPatient = useCallback(() => {
    navigation.navigate(Routes.HomeStack.Index, {
      screen: Routes.HomeStack.RegisterPatientStack.Index,
      params: {
        screen: Routes.HomeStack.RegisterPatientStack.PatientPersonalInfo,
      },
    });
  }, []);

  const onStartVisit = useCallback(() => {
    const newPatient: IPatient = {
      dateOfBirth: new Date(),
      bloodType: 'A+',
      city: 'Flemington',
      firstName: 'Alice',
      lastName: 'Klein',
      gender: FemaleGender.value,
      id: '1234789123654',
      lastVisit: new Date(),
    };
    setSelectedPatient(newPatient);
    navigation.navigate(Routes.HomeStack.HomeTabs.Index, {
      screen: Routes.HomeStack.PatientDetails,
    });
  }, []);

  return (
    <FullView>
      <StyledSafeAreaView
        height={screenPercentageToDP(29.16, Orientation.Height)}
        background={theme.colors.PRIMARY_MAIN}
      >
        <RowView width="100%" justifyContent="flex-end">
          <Button
            onPress={onNavigateToHome}
            width={80}
            backgroundColor="transparent"
          >
            <CrossIcon
              height={screenPercentageToDP(2.43, Orientation.Height)}
              width={screenPercentageToDP(2.43, Orientation.Height)}
            />
          </Button>
        </RowView>
      </StyledSafeAreaView>
      <StyledView
        position="absolute"
        top="18%"
        width="100%"
        alignItems="center"
        zIndex={2}
      >
        <UserAvatar {...newPatientAddedMock} />
      </StyledView>
      <FullView
        paddingTop={screenPercentageToDP(7.65, Orientation.Height)}
        background={theme.colors.BACKGROUND_GREY}
        alignItems="center"
      >
        <StyledText
          color={theme.colors.TEXT_SUPER_DARK}
          fontSize={screenPercentageToDP(3.4, Orientation.Height)}
          fontWeight="bold"
        >
          {newPatientAddedMock.displayName}
        </StyledText>
        <StyledText color={theme.colors.TEXT_MID} marginTop={10}>
          {newPatientAddedMock.gender}, {mockPatientData.age} years old,{' '}
          {mockPatientData.city}
        </StyledText>
        <StyledText
          fontSize={screenPercentageToDP(2.55, Orientation.Height)}
          color={theme.colors.PRIMARY_MAIN}
          marginTop={90}
          textAlign="center"
        >
          This patient has been{'\n'}added to the database
        </StyledText>
        <StyledSafeAreaView
          flex={1}
          justifyContent="flex-end"
          padding={screenPercentageToDP(2.43, Orientation.Height)}
        >
          <RowView
            width="100%"
            height={screenPercentageToDP(6.07, Orientation.Height)}
          >
            <Button
              onPress={onAddAnotherPatient}
              flex={1}
              outline
              borderColor={theme.colors.PRIMARY_MAIN}
              buttonText="Add another Patient"
              marginRight={screenPercentageToDP(2.43, Orientation.Width)}
            />
            <Button
              onPress={onStartVisit}
              flex={1}
              buttonText="Start Visit"
              backgroundColor={theme.colors.PRIMARY_MAIN}
            />
          </RowView>
        </StyledSafeAreaView>
      </FullView>
    </FullView>
  );
};

export const NewPatientScreen = compose(withPatient)(Screen);
