import React, { useCallback, ReactElement } from 'react';

import { compose } from 'redux';
import { BaseAppProps } from '~/ui/interfaces/BaseAppProps';
import { Routes } from '~/ui/helpers/routes';
import { withPatient } from '~/ui/containers/Patient';
import { joinNames, getGender } from '~/ui/helpers/user';
import { getAgeFromDate } from '~/ui/helpers/date';
import {
  StyledView,
  StyledSafeAreaView,
  FullView,
  RowView,
  StyledTouchableOpacity,
  StyledText,
  StyledScrollView,
} from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { screenPercentageToDP, Orientation } from '~/ui/helpers/screen';
import { ArrowLeftIcon } from '~/ui/components/Icons';
import { UserAvatar } from '~/ui/components/UserAvatar';
import { Button } from '~/ui/components/Button';
import {
  GeneralInfo,
  HealthIdentificationRow,
  PatientIssues,
  AdditionalInfo,
} from './CustomComponents';

const Screen = ({ navigation, selectedPatient }: BaseAppProps): ReactElement => {
  // const [reminders, setReminders] = useState(reminderWarnings);
  // const [editField, setEditField] = useState(false);

  // const changeReminder = useCallback((value: boolean) => {
  //   setReminders(value);
  // }, []);

  const onNavigateBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // const onEditField = useCallback(() => {
  //   setEditField(!editField);
  // }, [editField]);

  const onEditPatient = useCallback(() => {
    navigation.navigate(Routes.HomeStack.PatientDetailsStack.EditPatient, {
      patientName: joinNames(selectedPatient),
    });
  }, [navigation, selectedPatient]);

  const editPatientAdditionalData = useCallback(
    (additionalData) => {
      navigation.navigate(Routes.HomeStack.PatientDetailsStack.EditPatientAdditionalData, {
        patientId: selectedPatient.id,
        patientName: joinNames(selectedPatient),
        additionalDataJSON: JSON.stringify(additionalData),
      });
    },
    [navigation, selectedPatient],
  );

  const onEditPatientIssues = useCallback(() => {
    navigation.navigate(Routes.HomeStack.PatientDetailsStack.AddPatientIssue);
  }, [navigation]);

  const onRecordDeath = useCallback(() => {
    navigation.navigate(Routes.HomeStack.DeceasedStack.Index);
  }, [navigation]);

  return (
    <FullView>
      <StyledSafeAreaView background={theme.colors.PRIMARY_MAIN}>
        <StyledView background={theme.colors.PRIMARY_MAIN} height={170}>
          <RowView justifyContent="space-between">
            <StyledTouchableOpacity padding={20} onPress={onNavigateBack}>
              <ArrowLeftIcon
                height={screenPercentageToDP(2.43, Orientation.Height)}
                width={screenPercentageToDP(2.43, Orientation.Height)}
              />
            </StyledTouchableOpacity>
          </RowView>
          <RowView paddingLeft={screenPercentageToDP(4.86, Orientation.Width)}>
            <UserAvatar
              size={screenPercentageToDP(7.29, Orientation.Height)}
              displayName={joinNames(selectedPatient)}
              sex={selectedPatient.sex}
            />
            <StyledView alignItems="flex-start" marginLeft={10}>
              <StyledText
                color={theme.colors.WHITE}
                fontSize={screenPercentageToDP(3.4, Orientation.Height)}
                fontWeight="bold"
              >
                {joinNames(selectedPatient)}
              </StyledText>
              <StyledText
                color={theme.colors.WHITE}
                fontSize={screenPercentageToDP(1.94, Orientation.Height)}
              >
                {getGender(selectedPatient.sex)},{' '}
                {getAgeFromDate(new Date(selectedPatient.dateOfBirth))} years old
              </StyledText>
            </StyledView>
          </RowView>
        </StyledView>
        <HealthIdentificationRow patientId={selectedPatient.displayId} />
      </StyledSafeAreaView>
      <FullView>
        <StyledScrollView
          background={theme.colors.BACKGROUND_GREY}
          paddingLeft={20}
          paddingRight={20}
          paddingTop={20}
        >
          <GeneralInfo patient={selectedPatient} onEdit={onEditPatient} />
          <AdditionalInfo patient={selectedPatient} onEdit={editPatientAdditionalData} />
          {/* Not functional yet
          <NotificationCheckbox value={reminders} onChange={changeReminder} />
          <FamilyInformation
            onEdit={onEditField}
            parentsInfo={parentsInfo}
          />
          <OnGoingConditions
            onEdit={onEditField}
            ongoingConditions={ongoingConditions}
          />
          <FamilyHistory
            onEdit={onEditField}
            familyHistory={familyHistory}
          />
          <AllergiesList onEdit={onEditField} allergies={allergies} />
          */}
          <PatientIssues onEdit={onEditPatientIssues} patientId={selectedPatient.id} />
          <Button marginBottom={40} onPress={onRecordDeath} buttonText="Record patient death" />
        </StyledScrollView>
      </FullView>
    </FullView>
  );
};

export const PatientDetailsScreen = compose(withPatient)(Screen);
