import React, { useCallback, useState } from 'react';
import { compose } from 'redux';
import { ArrowLeftIcon } from '~/ui/components/Icons';
import { withPatient } from '~/ui/containers/Patient';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { joinNames } from '~/ui/helpers/user';
import { BaseAppProps } from '~/ui/interfaces/BaseAppProps';
import {
  CenterView,
  FullView,
  StyledSafeAreaView,
  StyledText,
  StyledTouchableOpacity,
  StyledView,
} from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { ContactCard } from '../CustomComponents/ContactCard';
import { ScrollView } from 'react-native-gesture-handler';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { useBackendEffect } from '~/ui/hooks';
import { IPatientContact } from '~/types';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { Button } from '~/ui/components/Button';
import { Routes } from '~/ui/helpers/routes';
import { PlusIcon } from '~/ui/components/Icons/PlusIcon';
import { useAuth } from '~/ui/contexts/AuthContext';
import { RemoveReminderContactModal } from './RemoveReminderContactModal';
import { PatientContact } from '~/models/PatientContact';

const getAllContacts = async (models, patientId): Promise<IPatientContact[]> => {
  return models.PatientContact.find({
    where: {
      patient: {
        id: patientId,
      },
    },
    order: {
      name: 'ASC',
    },
  });
};

const Screen = ({ navigation, selectedPatient }: BaseAppProps) => {
  const { getTranslation } = useTranslation();
  const [patientContacts, _, isLoading, refetch] = useBackendEffect(
    ({ models }) => getAllContacts(models, selectedPatient.id),
    [],
  );

  const { ability } = useAuth();
  const canWriteReminderContacts = ability.can('write', 'Patient');

  const [selectedContact, setSelectedContact] = useState<IPatientContact>();

  const onNavigateBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const onNavigateAddReminderContact = useCallback(() => {
    navigation.navigate(Routes.HomeStack.PatientDetailsStack.AddReminderContact);
  }, [navigation]);

  const onRemoveReminderContact = async () => {
    if (!selectedContact) return;
    await PatientContact.updateValues(selectedContact.id, {
      deletedAt: new Date(),
    });
    await refetch();
  };

  const patientName = joinNames(selectedPatient);

  const description = getTranslation(
    'patient.details.reminderContacts.description',
    'The below contact list is registered to receive reminders for :patientName.',
    { patientName },
  );

  const emptyDescription = getTranslation(
    'patient.details.reminderContacts.emptyDescription',

    "There are no contacts registered to receive reminders for :patientName. Please select 'Add contact' to register a contact.",
    { patientName },
  );

  return (
    <FullView background={theme.colors.WHITE}>
      <ScrollView>
        <StyledSafeAreaView>
          <StyledView paddingTop={20} paddingLeft={15} paddingRight={15} paddingBottom={20}>
            <StyledTouchableOpacity onPress={onNavigateBack}>
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
            {isLoading ? (
              <CenterView paddingTop={100}>
                <LoadingScreen />
              </CenterView>
            ) : (
              <>
                <StyledView paddingTop={15}>
                  <StyledText
                    color={
                      patientContacts?.length
                        ? theme.colors.TEXT_SUPER_DARK
                        : theme.colors.TEXT_DARK
                    }
                    fontSize={screenPercentageToDP(2, Orientation.Height)}
                    fontWeight={400}
                  >
                    {patientContacts?.length ? (
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
                {patientContacts?.map(x => (
                  <StyledView key={x.id} marginTop={15} marginBottom={10}>
                    <ContactCard {...x} />
                    {canWriteReminderContacts && (
                      <Button
                        onPress={() => setSelectedContact(x)}
                        height={screenPercentageToDP(4, Orientation.Height)}
                        marginRight={8}
                        paddingTop={4}
                        alignSelf="flex-end"
                        backgroundColor={theme.colors.WHITE}
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
                  </StyledView>
                ))}
              </>
            )}
            {selectedContact && (
              <RemoveReminderContactModal
                open
                onClose={() => setSelectedContact(undefined)}
                onRemoveReminderContact={onRemoveReminderContact}
              >
                <ContactCard {...selectedContact} />
              </RemoveReminderContactModal>
            )}
            {canWriteReminderContacts && (
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
                alignItems='center'
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
