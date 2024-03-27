import React, { useCallback } from 'react';
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
  const [list] = useBackendEffect(({ models }) => getAllContacts(models, selectedPatient.id), [
    selectedPatient,
  ]);

  const { ability } = useAuth();
  const canWriteReminderContacts = ability.can('write', 'Patient');

  const onNavigateBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const onNavigateAddReminderContact = useCallback(() => {
    navigation.navigate(Routes.HomeStack.PatientDetailsStack.AddReminderContact);
  }, [navigation]);

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
            {list ? (
              <StyledView paddingTop={15}>
                <StyledText
                  color={theme.colors.MAIN_SUPER_DARK}
                  fontSize={screenPercentageToDP(2, Orientation.Height)}
                  fontWeight={400}
                >
                  {list.length ? (
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
            ) : (
              <CenterView paddingTop={100}>
                <LoadingScreen />
              </CenterView>
            )}
            {list?.map(x => (
              <StyledView key={x.id} marginTop={15} marginBottom={10}>
                <ContactCard {...x} />
              </StyledView>
            ))}
            {canWriteReminderContacts && (
              <Button
                onPress={onNavigateAddReminderContact}
                backgroundColor={theme.colors.WHITE}
                borderColor={theme.colors.PRIMARY_MAIN}
                borderWidth={1}
                marginTop={15}
                width={screenPercentageToDP(36, Orientation.Width)}
                height={screenPercentageToDP(5, Orientation.Height)}
                textColor={theme.colors.PRIMARY_MAIN}
                fontSize={16}
                fontWeight={500}
                buttonText={
                  <TranslatedText
                    stringId="patient.details.reminderContacts.addContact"
                    fallback="Add contact"
                  />
                }
              >
                <StyledView marginRight={6}>
                  <PlusIcon />
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
