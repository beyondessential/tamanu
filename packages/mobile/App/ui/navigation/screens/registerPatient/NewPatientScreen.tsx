import React, { ReactElement, useCallback } from 'react';
import { FullView, RowView, StyledText, StyledSafeAreaView, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { Button } from '/components/Button';
import { CrossIcon } from '/components/Icons';
import { Routes } from '/helpers/routes';
import { compose } from 'redux';
import { withPatient } from '/containers/Patient';
import { NewPatientScreenProps } from '/interfaces/screens/RegisterPatientStack/NewPatientScreenProps';
import { joinNames } from '~/ui/helpers/user';
import { getAgeFromDate } from '~/ui/helpers/date';

const Screen = ({ navigation, selectedPatient }: NewPatientScreenProps): ReactElement => {
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
    navigation.navigate(Routes.HomeStack.HomeTabs.Index, {
      screen: Routes.HomeStack.PatientDetailsStack.Index,
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
            width={24}
            marginRight={10}
            backgroundColor="transparent"
          >
            <CrossIcon height={24} width={24} />
          </Button>
        </RowView>
      </StyledSafeAreaView>
      <StyledView position="absolute" top="18%" width="100%" alignItems="center" zIndex={2}>
        <StyledText
          color={theme.colors.WHITE}
          fontSize={screenPercentageToDP(3.4, Orientation.Height)}
          fontWeight="bold"
        >
          {selectedPatient.displayId}
        </StyledText>
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
          {joinNames(selectedPatient)}
        </StyledText>
        <StyledText color={theme.colors.TEXT_MID} marginTop={10}>
          {selectedPatient.gender} {getAgeFromDate(selectedPatient.dateOfBirth).toString()} years
          old{' '}
        </StyledText>
        <StyledText
          fontSize={screenPercentageToDP(2.55, Orientation.Height)}
          color={theme.colors.PRIMARY_MAIN}
          marginTop={90}
          textAlign="center"
        >
          {selectedPatient.firstName} has been{'\n'}added to the database
        </StyledText>
        <StyledSafeAreaView
          flex={1}
          justifyContent="flex-end"
          padding={screenPercentageToDP(2.43, Orientation.Height)}
        >
          <RowView width="100%" height={screenPercentageToDP(6.07, Orientation.Height)}>
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
