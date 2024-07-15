import React, { ReactElement, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { FullView } from '/styled/common';
import { StackHeader } from '~/ui/components/StackHeader';
import { PatientPersonalInfoForm } from '/components/Forms/NewPatientForm/PatientPersonalInfoForm';
import { theme } from '/styled/theme';
import { TextField } from '~/ui/components/TextField/TextField';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { GenderOptions, Gender } from '~/ui/helpers/constants';
import { RadioButtonGroup } from '~/ui/components/RadioButtonGroup';
import { DateField } from '~/ui/components/DateField/DateField';
import { PatientAdditionalDataFields } from '~/ui/components/Forms/PatientAdditionalDataForm/PatientAdditionalDataFields';
import { CAMBODIA_ADDITIONAL_DATA_FIELDS, CAMBODIA_CUSTOM_FIELDS } from './fields';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';

export const Fields = ({ isEdit }): ReactElement => {
  const { getBool } = useLocalisation();
  let filteredGenderOptions = GenderOptions;
  if (getBool('features.hideOtherSex') === true) {
    filteredGenderOptions = filteredGenderOptions.filter(({ value }) => value !== Gender.Other);
  }

  return (
    <>
      <LocalisedField
        label={
          <TranslatedText stringId="general.localisedField.lastName.label" fallback="Last name" />
        }
        name="lastName"
        component={TextField}
        required
      />
      <LocalisedField
        label={
          <TranslatedText stringId="general.localisedField.firstName.label" fallback="First name" />
        }
        name="firstName"
        component={TextField}
        required
      />
      <LocalisedField
        label={
          <TranslatedText
            stringId="general.localisedField.dateOfBirth.label"
            fallback="Date of birth"
          />
        }
        name="dateOfBirth"
        max={new Date()}
        component={DateField}
        required
      />
      <LocalisedField
        label={<TranslatedText stringId="general.localisedField.sex.label" fallback="Sex" />}
        name="sex"
        options={filteredGenderOptions}
        component={RadioButtonGroup}
        required
      />
      <LocalisedField
        label={
          <TranslatedText
            stringId="general.localisedField.culturalName.label"
            fallback="Cultural name"
          />
        }
        name="culturalName"
        component={TextField}
        required={getBool('fields.culturalName.requiredPatientData')}
      />
      <PatientAdditionalDataFields fields={[CAMBODIA_CUSTOM_FIELDS.FATHERS_FIRST_NAME]} />
      {!isEdit && (
        <PatientAdditionalDataFields
          isEdit={false}
          fields={Object.values(CAMBODIA_ADDITIONAL_DATA_FIELDS).flat()}
        />
      )}
    </>
  );
};

export const EditPatientScreen = ({ route, isEdit = true }): ReactElement => {
  const navigation = useNavigation();
  const onGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <FullView background={theme.colors.BACKGROUND_GREY}>
      <StatusBar barStyle="light-content" />
      <StackHeader
        title={
          isEdit ? (
            <TranslatedText stringId="patient.details.action.edit" fallback="Edit Patient" />
          ) : (
            <TranslatedText stringId="patient.register.title" fallback="Register New Patient" />
          )
        }
        subtitle={route?.params?.patientName}
        onGoBack={onGoBack}
      />
      <PatientPersonalInfoForm isEdit={isEdit}>
        <Fields isEdit={isEdit} />
      </PatientPersonalInfoForm>
    </FullView>
  );
};
