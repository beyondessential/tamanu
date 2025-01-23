import React, { ReactElement, useCallback } from 'react';
import * as yup from 'yup';
import { ScrollView } from 'react-native-gesture-handler';
import { compose } from 'redux';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { ArrowLeftIcon } from '~/ui/components/Icons';
import { withPatient } from '~/ui/containers/Patient';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { joinNames } from '~/ui/helpers/user';
import { BaseAppProps } from '~/ui/interfaces/BaseAppProps';
import {
  StyledSafeAreaView,
  StyledView,
  StyledTouchableOpacity,
  StyledText,
} from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { Form } from '~/ui/components/Forms/Form';
import { Button } from '~/ui/components/Button';
import { TextField } from '~/ui/components/TextField/TextField';
import { Routes } from '~/ui/helpers/routes';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { PatientContact } from '~/models/PatientContact';
import { SuggesterDropdown } from '~/ui/components/Dropdown';
import { PATIENT_COMMUNICATION_CHANNELS } from '~/constants/comms';
import { useReminderContact } from '~/ui/contexts/ReminderContactContext';

interface IFormValues {
  reminderContactName: string;
  reminderContactRelationship: string;
}

const Screen = ({ navigation, selectedPatient }: BaseAppProps) => {
  const { getTranslation } = useTranslation();
  const { afterAddContact } = useReminderContact();

  const onNavigateBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const submit = async (values: IFormValues) => {
    const newContact = await PatientContact.createAndSaveOne<PatientContact>({
      name: values.reminderContactName,
      relationship: values.reminderContactRelationship,
      method: PATIENT_COMMUNICATION_CHANNELS.TELEGRAM,
      patient: selectedPatient.id,
    });
    afterAddContact(
      {
        ...newContact,
        relationshipId: values.reminderContactRelationship,
        patientId: selectedPatient.id,
        patient: newContact.patient as any,
        relationship: newContact.relationship as any,
      },
      true,
    );
    navigation.navigate(Routes.HomeStack.PatientDetailsStack.ReminderContactQR, {
      contactId: newContact.id,
    });
  };

  const patientName = joinNames(selectedPatient);

  const note = getTranslation(
    'patient.details.addReminderContact.note',
    'By providing their details, the individual consents to receiving automated reminder messages for :patientName.',
    { replacements: { patientName } },
  );

  return (
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
                stringId="patient.details.addReminderContact.title"
                fallback="Add reminder contact"
              />
            </StyledText>
          </StyledView>
          <StyledView paddingTop={25}>
            <StyledText
              color={theme.colors.TEXT_SUPER_DARK}
              fontSize={screenPercentageToDP(2, Orientation.Height)}
              fontWeight={500}
            >
              <TranslatedText
                stringId="patient.details.addReminderContact.mobileDescription"
                fallback="Please provide details below to add a new contact."
              />
            </StyledText>
          </StyledView>
          <StyledView paddingTop={10}>
            <StyledText
              color={theme.colors.TEXT_DARK}
              fontSize={screenPercentageToDP(2, Orientation.Height)}
              fontWeight={400}
            >
              <StyledText>{note.split(`${patientName}.`)[0]}</StyledText>
              <StyledText fontWeight={600}>{patientName}.</StyledText>
            </StyledText>
          </StyledView>
          <Form
            initialValues={{
              reminderContactName: '',
              reminderContactRelationship: '',
            }}
            validationSchema={yup.object().shape({
              reminderContactName: yup
                .string()
                .required()
                .translatedLabel(
                  <TranslatedText
                    stringId="general.localisedField.reminderContactName.label"
                    fallback="Contact Name"
                  />,
                ),
              reminderContactRelationship: yup
                .string()
                .required()
                .translatedLabel(
                  <TranslatedText
                    stringId="general.localisedField.reminderContactRelationship.label"
                    fallback="Relationship"
                  />,
                ),
            })}
            onSubmit={submit}
          >
            {({ handleSubmit, isSubmitting, values }): ReactElement => {
              const isPopulated =
                values.reminderContactName?.trim() && values.reminderContactRelationship;

              return (
                <>
                  <StyledView marginTop={25}>
                    <LocalisedField
                      name="reminderContactName"
                      component={TextField}
                      label={
                        <TranslatedText
                          stringId="general.localisedField.reminderContactName.label"
                          fallback="Contact Name"
                        />
                      }
                      placeholder={getTranslation(
                        'patient.details.addReminderContact.placeholder.contactName',
                        'Contact Name',
                      )}
                      required
                    />
                  </StyledView>
                  <StyledView marginTop={10}>
                    <LocalisedField
                      name="reminderContactRelationship"
                      component={SuggesterDropdown}
                      referenceDataType="contactRelationship"
                      label={
                        <TranslatedText
                          stringId="general.localisedField.reminderContactRelationship.label"
                          fallback="Relationship"
                        />
                      }
                      selectPlaceholderText={getTranslation(
                        'patient.details.addReminderContact.placeholder.select',
                        'Select',
                      )}
                      required
                    />
                  </StyledView>
                  <Button
                    backgroundColor={theme.colors.PRIMARY_MAIN}
                    onPress={handleSubmit}
                    loadingAction={isSubmitting}
                    marginTop={10}
                    height={screenPercentageToDP(5, Orientation.Height)}
                    disabled={!isPopulated}
                  >
                    <StyledText
                      color={theme.colors.WHITE}
                      fontSize={screenPercentageToDP(2, Orientation.Height)}
                      fontWeight={500}
                    >
                      <TranslatedText
                        stringId="patient.details.addReminderContact.action.confirm"
                        fallback="Confirm & connect"
                      />
                    </StyledText>
                  </Button>
                  <Button
                    onPress={onNavigateBack}
                    backgroundColor={theme.colors.WHITE}
                    borderColor={theme.colors.PRIMARY_MAIN}
                    borderWidth={1}
                    marginTop={10}
                    height={screenPercentageToDP(5, Orientation.Height)}
                  >
                    <StyledText
                      color={theme.colors.PRIMARY_MAIN}
                      fontSize={screenPercentageToDP(2, Orientation.Height)}
                      fontWeight={500}
                    >
                      <TranslatedText
                        stringId="patient.details.addReminderContact.action.cancel"
                        fallback="Cancel"
                      />
                    </StyledText>
                  </Button>
                </>
              );
            }}
          </Form>
        </StyledView>
      </StyledSafeAreaView>
    </ScrollView>
  );
};

export const AddReminderContactScreen = compose(withPatient)(Screen);
