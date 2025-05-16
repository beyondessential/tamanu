import React, { ReactElement, useCallback } from 'react';

import { compose } from 'redux';
import { BaseAppProps } from '~/ui/interfaces/BaseAppProps';
import { Routes } from '~/ui/helpers/routes';
import { withPatient } from '~/ui/containers/Patient';
import { getGender, joinNames } from '~/ui/helpers/user';
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
import { HealthIdentificationRow, PatientIssues } from './CustomComponents';
import { PatientDetails } from './PatientDetails';
import { Button } from '~/ui/components/Button';
import { ReminderBellIcon } from '~/ui/components/Icons/ReminderBellIcon';
import { useAuth } from '~/ui/contexts/AuthContext';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { useBackendEffect } from '~/ui/hooks';
import { SETTING_KEYS } from '~/constants';
import { useSettings } from '/contexts/SettingsContext';

const Screen = ({ navigation, selectedPatient }: BaseAppProps): ReactElement => {
  const { ability } = useAuth();
  const canReadReminderContacts = ability.can('read', 'Patient');

  const [isReminderContactEnabled] = useBackendEffect(async ({ models }) => {
    return await models.Setting.getByKey(SETTING_KEYS.FEATURES_REMINDER_CONTACT_ENABLED);
  }, []);

  const onNavigateBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const onEditPatientIssues = useCallback(() => {
    navigation.navigate(Routes.HomeStack.PatientDetailsStack.AddPatientIssue);
  }, [navigation]);

  const { getSetting } = useSettings();
  const ageDisplayFormat = getSetting('ageDisplayFormat');

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
          {canReadReminderContacts && !!isReminderContactEnabled && (
            <StyledView alignSelf="flex-end" alignItems="flex-end" marginRight={15}>
              <Button
                marginTop={screenPercentageToDP(1.21, Orientation.Height)}
                width={screenPercentageToDP(26, Orientation.Width)}
                height={screenPercentageToDP(4.2, Orientation.Height)}
                buttonText={
                  <TranslatedText
                    stringId="patient.details.reminderContacts.contactsButton"
                    fallback="Contacts"
                  />
                }
                fontSize={screenPercentageToDP(2, Orientation.Height)}
                fontWeight={500}
                alignItems="center"
                onPress={onNavigateReminder}
                outline
                borderColor={theme.colors.WHITE}
              >
                <StyledView marginRight={screenPercentageToDP(0.6, Orientation.Height)}>
                  <ReminderBellIcon
                    width={screenPercentageToDP(1.8, Orientation.Height)}
                    height={screenPercentageToDP(2, Orientation.Height)}
                  />
                </StyledView>
              </Button>
            </StyledView>
          )}
        </RowView>
        <HealthIdentificationRow patientId={selectedPatient.displayId} />
      </StyledSafeAreaView>
      <FullView>
        <StyledScrollView background={theme.colors.BACKGROUND_GREY}>
          <PatientDetails navigation={navigation} patient={selectedPatient} />
          <PatientIssues onEdit={onEditPatientIssues} patientId={selectedPatient.id} />
        </StyledScrollView>
      </FullView>
    </FullView>
  );
};

export const PatientDetailsScreen = compose(withPatient)(Screen);
