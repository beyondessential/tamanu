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
  const [list] = useBackendEffect(({ models }) => getAllContacts(models, selectedPatient.id), [
    selectedPatient,
  ]);

  const onNavigateBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

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
                  {list.length > 0 ? (
                    <TranslatedText
                      stringId="patient.details.reminderContacts.description"
                      fallback="The below contact list is registered to receive reminders for :patientName."
                      replacements={{ patientName: joinNames(selectedPatient) }}
                    />
                  ) : (
                    <>
                      <TranslatedText
                        stringId="patient.details.reminderContacts.empty"
                        fallback="There are no contacts registered to receive reminders for :patientName. Please select 'Add contact' to register a contact."
                        replacements={{ patientName: joinNames(selectedPatient) }}
                      />
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
          </StyledView>
        </StyledSafeAreaView>
      </ScrollView>
    </FullView>
  );
};

export const ReminderContactScreen = compose(withPatient)(Screen);
