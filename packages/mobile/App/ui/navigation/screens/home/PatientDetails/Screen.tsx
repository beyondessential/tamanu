import React, { ReactElement, useCallback } from 'react';

import { compose } from 'redux';
import { BaseAppProps } from '~/ui/interfaces/BaseAppProps';
import { Routes } from '~/ui/helpers/routes';
import { withPatient } from '~/ui/containers/Patient';
import { getGender, joinNames } from '~/ui/helpers/user';
import { getAgeFromDate } from '~/ui/helpers/date';
import {
  FullView,
  RowView,
  StyledSafeAreaView,
  StyledScrollView,
  StyledText,
  StyledTouchableOpacity,
  StyledView,
} from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { ArrowLeftIcon } from '~/ui/components/Icons';
import { UserAvatar } from '~/ui/components/UserAvatar';
import {
  AdditionalInfo,
  GeneralInfo,
  HealthIdentificationRow,
  PatientIssues,
} from './CustomComponents';
import { Button } from '~/ui/components/Button';
import { ReminderBellIcon } from '~/ui/components/Icons/ReminderBellIcon';

const Screen = ({ navigation, selectedPatient }: BaseAppProps): ReactElement => {
  const onNavigateBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const onEditPatient = useCallback(() => {
    navigation.navigate(Routes.HomeStack.PatientDetailsStack.EditPatient, {
      patientName: joinNames(selectedPatient),
    });
  }, [navigation, selectedPatient]);

  const editPatientAdditionalData = useCallback(
    (
      additionalData,
      sectionTitle,
      isCustomFields,
      customSectionFields,
      customPatientFieldValues,
    ) => {
      navigation.navigate(Routes.HomeStack.PatientDetailsStack.EditPatientAdditionalData, {
        patientId: selectedPatient.id,
        patientName: joinNames(selectedPatient),
        additionalDataJSON: JSON.stringify(additionalData),
        sectionTitle,
        isCustomFields,
        customSectionFields,
        customPatientFieldValues,
      });
    },
    [navigation, selectedPatient],
  );

  const onEditPatientIssues = useCallback(() => {
    navigation.navigate(Routes.HomeStack.PatientDetailsStack.AddPatientIssue);
  }, [navigation]);

  const onNavigateReminder = useCallback(() => {
    navigation.navigate(Routes.HomeStack.PatientDetailsStack.Reminder);
  }, [navigation, selectedPatient]);

  return (
    <FullView>
      <StyledSafeAreaView background={theme.colors.PRIMARY_MAIN}>
        <RowView
          justifyContent="flex-start"
          alignItems="center"
          paddingTop={20}
          paddingLeft={15}
          paddingBottom={20}
        >
          <StyledTouchableOpacity onPress={onNavigateBack}>
            <ArrowLeftIcon size={screenPercentageToDP(3, Orientation.Height)} />
          </StyledTouchableOpacity>
          <StyledView marginLeft={15}>
            <UserAvatar
              size={screenPercentageToDP(6, Orientation.Height)}
              displayName={joinNames(selectedPatient)}
              sex={selectedPatient.sex}
            />
          </StyledView>
          <StyledView marginLeft={12}>
            <StyledText
              color={theme.colors.WHITE}
              fontSize={screenPercentageToDP(2.6, Orientation.Height)}
              fontWeight={500}
            >
              {joinNames(selectedPatient)}
            </StyledText>
            <StyledText
              color={theme.colors.WHITE}
              fontSize={screenPercentageToDP(2, Orientation.Height)}
            >
              {`${getGender(selectedPatient.sex)}, `}
              {`${getAgeFromDate(selectedPatient.dateOfBirth)} years old`}
            </StyledText>
          </StyledView>
          <StyledView flex={1} alignSelf="flex-end" alignItems="flex-end" marginRight={15}>
            <Button
              marginTop={screenPercentageToDP(1.21, Orientation.Height)}
              width={screenPercentageToDP(23.11, Orientation.Width)}
              height={screenPercentageToDP(4.86, Orientation.Height)}
              buttonText=" Contacts"
              fontSize={screenPercentageToDP(1.57, Orientation.Height)}
              onPress={onNavigateReminder}
              outline
              borderColor={theme.colors.WHITE}
            >
              <ReminderBellIcon />
            </Button>
          </StyledView>
        </RowView>
        <HealthIdentificationRow patientId={selectedPatient.displayId} />
      </StyledSafeAreaView>
      <FullView>
        <StyledScrollView background={theme.colors.BACKGROUND_GREY}>
          <GeneralInfo patient={selectedPatient} onEdit={onEditPatient} />
          <AdditionalInfo patient={selectedPatient} onEdit={editPatientAdditionalData} />
          <PatientIssues onEdit={onEditPatientIssues} patientId={selectedPatient.id} />
        </StyledScrollView>
      </FullView>
    </FullView>
  );
};

export const PatientDetailsScreen = compose(withPatient)(Screen);
