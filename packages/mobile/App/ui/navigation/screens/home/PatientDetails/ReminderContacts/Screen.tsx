import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useCallback } from 'react';
import { Alert } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { compose } from 'redux';
import { PatientContact } from '~/models/PatientContact';
import { type IPatientContact, ReferenceDataType } from '~/types';
import { Button } from '~/ui/components/Button';
import { ArrowLeftIcon } from '~/ui/components/Icons';
import { PlusIcon } from '~/ui/components/Icons/PlusIcon';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { withPatient } from '~/ui/containers/Patient';
import { useAuth } from '~/ui/contexts/AuthContext';
import { useReminderContact } from '~/ui/contexts/ReminderContactContext';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { Routes } from '~/ui/helpers/routes';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { joinNames } from '~/ui/helpers/user';
import { patientKeys } from '~/ui/hooks/queries/queryKeys';
import type { BaseAppProps } from '~/ui/interfaces/BaseAppProps';
import {
  CenterView,
  FullView,
  RowView,
  StyledSafeAreaView,
  StyledText,
  StyledTouchableOpacity,
  StyledView,
} from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { ContactCard } from '../CustomComponents/ContactCard';

const Screen = ({ navigation, selectedPatient }: BaseAppProps) => {
  const { getTranslation, getReferenceDataTranslation } = useTranslation();
  const { reminderContactList, isLoadingReminderContactList, afterAddContact, isFailedContact } =
    useReminderContact();

  const { ability } = useAuth();
  const canWriteReminderContacts = ability.can('write', 'Patient');

  const onNavigateAddReminderContact = useCallback(() => {
    navigation.navigate(Routes.HomeStack.PatientDetailsStack.AddReminderContact);
  }, [navigation]);

  const queryClient = useQueryClient();
  const { mutate: removeReminderContact } = useMutation({
    mutationFn: (contact: IPatientContact) =>
      PatientContact.updateValues(contact.id, { deletedAt: new Date() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.contacts(selectedPatient.id) });
    },
    onError: error => {
      console.error('Delete contact failed: ', error);
    },
  });

  const confirmRemoveReminderContact = (contact: IPatientContact) => {
    const relationship = getReferenceDataTranslation({
      category: ReferenceDataType.ContactRelationship,
      value: contact.relationship?.id,
      fallback: contact.relationship?.name,
    });
    Alert.alert(
      getTranslation('patient.details.removeReminderContact.title', 'Remove reminder contact?'),
      getTranslation(
        'patient.details.removeReminderContact.confirmation.withNameAndRelationship',
        ':contactName (:relationship)\n\nYou can add them again at any time',
        { replacements: { contactName: contact.name, relationship } },
      ),
      [
        { text: getTranslation('general.action.keep', 'Keep'), style: 'cancel' },
        {
          text: getTranslation('patient.details.removeReminderContact.action.remove', 'Remove'),
          style: 'destructive',
          onPress: () => removeReminderContact(contact),
        },
      ],
    );
  };

  const onRetryConnect = (contact: IPatientContact) => {
    afterAddContact(contact);
    navigation.navigate(Routes.HomeStack.PatientDetailsStack.ReminderContactQR, {
      contactId: contact.id,
    });
  };

  const patientName = joinNames(selectedPatient);

  const description = getTranslation(
    'patient.details.reminderContacts.description',
    'The below contact list is registered to receive reminders for :patientName.',
    { replacements: { patientName } },
  );

  const emptyDescription = getTranslation(
    'patient.details.reminderContacts.emptyDescription',
    "There are no contacts registered to receive reminders for :patientName. Please select 'Add contact' to register a contact.",
    { replacements: { patientName } },
  );

  return (
    <FullView background={theme.colors.WHITE}>
      <ScrollView>
        <StyledSafeAreaView>
          <StyledView paddingTop={20} paddingLeft={15} paddingRight={15} paddingBottom={20}>
            <StyledTouchableOpacity onPress={navigation.goBack}>
              <ArrowLeftIcon
                fill={theme.colors.PRIMARY_MAIN}
                size={screenPercentageToDP(4, Orientation.Height)}
              />
            </StyledTouchableOpacity>

            <StyledView paddingTop={15}>
              <StyledText
                color={theme.colors.TEXT_SUPER_DARK}
                fontSize={screenPercentageToDP(3, Orientation.Height)}
                fontWeight={500}
              >
                <TranslatedText
                  stringId="patient.details.reminderContacts.title"
                  fallback="Reminder contacts"
                />
              </StyledText>
            </StyledView>
            {isLoadingReminderContactList ? (
              <CenterView paddingTop={100}>
                <LoadingScreen />
              </CenterView>
            ) : (
              <>
                <StyledView paddingTop={15}>
                  <StyledText
                    color={
                      reminderContactList?.length
                        ? theme.colors.TEXT_SUPER_DARK
                        : theme.colors.TEXT_DARK
                    }
                    fontSize={screenPercentageToDP(2, Orientation.Height)}
                    fontWeight={400}
                  >
                    {reminderContactList?.length ? (
                      <>
                        <StyledText>{description.split(`${patientName}.`)[0]}</StyledText>
                        <StyledText fontWeight={600}>{patientName}.</StyledText>
                      </>
                    ) : (
                      <>
                        <StyledText>{emptyDescription.split(`${patientName}.`)[0]}</StyledText>
                        <StyledText fontWeight={600}>{patientName}.</StyledText>
                        <StyledText>{emptyDescription.split(`${patientName}.`)[1]}</StyledText>
                      </>
                    )}
                  </StyledText>
                </StyledView>
                {reminderContactList?.map(x => (
                  <StyledView key={x.id} marginTop={15} marginBottom={10}>
                    <ContactCard {...x} />
                    <RowView justifyContent="flex-end">
                      {isFailedContact(x) && (
                        <Button
                          onPress={() => onRetryConnect(x)}
                          height={screenPercentageToDP(4, Orientation.Height)}
                          marginRight={canWriteReminderContacts ? 16 : 8}
                          paddingTop={4}
                          alignSelf="flex-end"
                          backgroundColor={theme.colors.WHITE}
                          maxWidth={100}
                        >
                          <StyledText
                            color={theme.colors.PRIMARY_MAIN}
                            textDecorationLine="underline"
                            fontWeight={500}
                            fontSize={screenPercentageToDP(2, Orientation.Height)}
                          >
                            <TranslatedText
                              stringId="patient.details.reminderContacts.action.retry"
                              fallback="Retry"
                            />
                          </StyledText>
                        </Button>
                      )}
                      {canWriteReminderContacts && (
                        <Button
                          onPress={() => confirmRemoveReminderContact(x)}
                          height={screenPercentageToDP(4, Orientation.Height)}
                          marginRight={8}
                          paddingTop={4}
                          alignSelf="flex-end"
                          backgroundColor={theme.colors.WHITE}
                          maxWidth={200}
                        >
                          <StyledText
                            color={theme.colors.PRIMARY_MAIN}
                            textDecorationLine="underline"
                            fontWeight={500}
                            fontSize={screenPercentageToDP(2, Orientation.Height)}
                          >
                            <TranslatedText
                              stringId="patient.details.reminderContacts.action.remove"
                              fallback="Remove"
                            />
                          </StyledText>
                        </Button>
                      )}
                    </RowView>
                  </StyledView>
                ))}
              </>
            )}
            {canWriteReminderContacts && !isLoadingReminderContactList && (
              <Button
                onPress={onNavigateAddReminderContact}
                backgroundColor={theme.colors.WHITE}
                borderColor={theme.colors.PRIMARY_MAIN}
                borderWidth={1}
                marginTop={15}
                width={screenPercentageToDP(34, Orientation.Width)}
                height={screenPercentageToDP(5, Orientation.Height)}
                textColor={theme.colors.PRIMARY_MAIN}
                fontSize={screenPercentageToDP(2, Orientation.Height)}
                fontWeight={500}
                alignItems="center"
                buttonText={
                  <TranslatedText
                    stringId="patient.details.reminderContacts.action.add"
                    fallback="Add contact"
                  />
                }
              >
                <StyledView marginRight={screenPercentageToDP(0.6, Orientation.Height)}>
                  <PlusIcon
                    width={screenPercentageToDP(1.8, Orientation.Height)}
                    height={screenPercentageToDP(1.8, Orientation.Height)}
                  />
                </StyledView>
              </Button>
            )}
          </StyledView>
        </StyledSafeAreaView>
      </ScrollView>
    </FullView>
  );
};

export const ReminderContactScreen = compose(withPatient)(Screen);
