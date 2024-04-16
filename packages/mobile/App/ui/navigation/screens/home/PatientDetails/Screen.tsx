import React, { ReactElement, useCallback } from 'react';

import { compose } from 'redux';
import { BaseAppProps } from '~/ui/interfaces/BaseAppProps';
import { Routes } from '~/ui/helpers/routes';
import { withPatient } from '~/ui/containers/Patient';
import { joinNames, getGender } from '~/ui/helpers/user';
import { getDisplayAge } from '~/ui/helpers/date';
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
import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { Button } from '~/ui/components/Button';
import { ReminderBellIcon } from '~/ui/components/Icons/ReminderBellIcon';
import { useAuth } from '~/ui/contexts/AuthContext';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';

const Screen = ({ navigation, selectedPatient }: BaseAppProps): ReactElement => {
  const { ability } = useAuth();
  const canReadReminderContacts = ability.can('read', 'Patient');

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

  const { getLocalisation, getBool } = useLocalisation();
  const ageDisplayFormat = getLocalisation('ageDisplayFormat');

  const onNavigateReminder = useCallback(() => {
    navigation.navigate(Routes.HomeStack.PatientDetailsStack.ReminderContacts);
  }, [navigation]);

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
          <StyledView flex={1} alignItems="flex-start" marginLeft={12} marginRight={12}>
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
              {`${getDisplayAge(selectedPatient.dateOfBirth, ageDisplayFormat)} old`}
            </StyledText>
          </StyledView>
          {canReadReminderContacts && getBool('features.reminderContactModule.enabled') && (
            <StyledView alignSelf="flex-end" alignItems="flex-end" marginRight={15}>
              <Button
                marginTop={screenPercentageToDP(1.21, Orientation.Height)}
                width={screenPercentageToDP(23.11, Orientation.Width)}
                height={screenPercentageToDP(4.2, Orientation.Height)}
                buttonText={
                  <TranslatedText
                    stringId="patient.details.reminderContacts.contactsButton"
                    fallback="Contacts"
                  />
                }
                fontSize={screenPercentageToDP(1.57, Orientation.Height)}
                onPress={onNavigateReminder}
                outline
                borderColor={theme.colors.WHITE}
              >
                <StyledView marginRight={6}>
                  <ReminderBellIcon />
                </StyledView>
              </Button>
            </StyledView>
          )}
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
