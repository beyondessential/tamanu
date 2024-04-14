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
import { PATIENT_CONTACT_METHODS } from '~/constants';

interface IFormValues {
  reminderContactName: string;
  reminderContactRelationship: string;
}

const Screen = ({ navigation, selectedPatient }: BaseAppProps) => {
  const { getTranslation } = useTranslation();

  const onNavigateBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const submit = async (values: IFormValues) => {
    const newContact = await PatientContact.createAndSaveOne<PatientContact>({
      name: values.reminderContactName,
      relationship: values.reminderContactRelationship,
      method: PATIENT_CONTACT_METHODS.TELEGRAM,
      patient: selectedPatient.id,
    });
    navigation.navigate(Routes.HomeStack.PatientDetailsStack.ReminderContactQR, {
      contactId: newContact.id,
    });
  };

  const patientName = joinNames(selectedPatient);

  const note = getTranslation(
    'patient.details.addReminderContact.note',
    'By providing their details, the individual consents to receiving automated reminder messages for :patientName.',
    { patientName },
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
              color={theme.colors.MAIN_SUPER_DARK}
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
              color={theme.colors.MAIN_SUPER_DARK}
              fontSize={screenPercentageToDP(2, Orientation.Height)}
              fontWeight={500}
            >
              <TranslatedText
                stringId="patient.details.addReminderContact.description"
                fallback="Please provide details below to add a new contact."
              />
            </StyledText>
          </StyledView>
          <StyledView paddingTop={10}>
            <StyledText
              color={theme.colors.MAIN_SUPER_DARK}
              fontSize={screenPercentageToDP(2, Orientation.Height)}
              fontWeight={400}
            >
              <StyledText>{note.split(`${patientName}.`)[0]}</StyledText>
              <StyledText fontWeight={500}>{patientName}.</StyledText>
            </StyledText>
          </StyledView>
          <Form
            initialValues={{
              reminderContactName: '',
              reminderContactRelationship: '',
            }}
            validationSchema={yup.object().shape({
              reminderContactName: yup.string().required('Contact name is required'),
              reminderContactRelationship: yup.string().required('Relationship is required'),
            })}
            onSubmit={submit}
          >
            {({ handleSubmit, isSubmitting }): ReactElement => {
              return (
                <>
                  <StyledView marginTop={25}>
                    <LocalisedField
                      name="reminderContactName"
                      component={TextField}
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
                    fontSize={16}
                  >
                    <StyledText color={theme.colors.WHITE} fontSize={16} fontWeight={500}>
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
                  >
                    <StyledText color={theme.colors.PRIMARY_MAIN} fontSize={16} fontWeight={500}>
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
