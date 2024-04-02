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
import { useAuth } from '~/ui/contexts/AuthContext';
import { Button } from '~/ui/components/Button';
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
      createdAt: 'ASC',
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

  const onRemoveReminderContact = async () => {
    if (selectedContact) {
      await PatientContact.updateValues(selectedContact.id, {
        deletedAt: new Date(),
      });
      await refetch();
    }
  };

  const patientName = joinNames(selectedPatient);

  const description = getTranslation({
    stringId: 'patient.details.reminderContacts.description',
    fallback: 'The below contact list is registered to receive reminders for :patientName.',
    replacements: { patientName },
  });

  const emptyDescription = getTranslation({
    stringId: 'patient.details.reminderContacts.emptyDescription',
    fallback:
      "There are no contacts registered to receive reminders for :patientName. Please select 'Add contact' to register a contact.",
    replacements: { patientName },
  });

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
                color={theme.colors.MAIN_SUPER_DARK}
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
                    color={theme.colors.MAIN_SUPER_DARK}
                    fontSize={screenPercentageToDP(2, Orientation.Height)}
                    fontWeight={400}
                  >
                    {patientContacts?.length ? (
                      <>
                        <StyledText>{description.split(`${patientName}.`)[0]}</StyledText>
                        <StyledText fontWeight={500}>{patientName}.</StyledText>
                      </>
                    ) : (
                      <>
                        <StyledText>{emptyDescription.split(`${patientName}.`)[0]}</StyledText>
                        <StyledText fontWeight={500}>{patientName}.</StyledText>
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
                        height={24}
                        marginRight={8}
                        paddingTop={4}
                        alignSelf="flex-end"
                        backgroundColor={theme.colors.WHITE}
                      >
                        <StyledText
                          color={theme.colors.PRIMARY_MAIN}
                          textDecorationLine="underline"
                          fontWeight={500}
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
          </StyledView>
        </StyledSafeAreaView>
      </ScrollView>
    </FullView>
  );
};

export const ReminderContactScreen = compose(withPatient)(Screen);
