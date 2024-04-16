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
import { allAdditionalDataFields } from '~/ui/helpers/additionalData';
import { PatientFieldDefinitionTypes } from '~/ui/helpers/fields';

export const Fields = (): ReactElement => {
  const { getBool } = useLocalisation();
  let filteredGenderOptions = GenderOptions;
  if (getBool('features.hideOtherSex') === true) {
    filteredGenderOptions = filteredGenderOptions.filter(({ value }) => value !== Gender.Other);
  }

  return (
    <>
      <LocalisedField name="lastName" component={TextField} required />
      <LocalisedField name="firstName" component={TextField} required />
      <LocalisedField name="dateOfBirth" max={new Date()} component={DateField} required />
      <LocalisedField
        name="sex"
        options={filteredGenderOptions}
        component={RadioButtonGroup}
        required
      />
      <PatientAdditionalDataFields
        fields={[
          {
            id: 'fieldDefinition-fathersFirstName',
            name: 'Fathers first name',
            fieldType: PatientFieldDefinitionTypes.STRING,
          },
        ]}
        isCustomFields={true}
      />
      <LocalisedField
        name="culturalName"
        component={TextField}
        required={getBool('fields.culturalName.requiredPatientData')}
      />
      <PatientAdditionalDataFields
        fields={allAdditionalDataFields}
        showMandatory
        isCustomFields={false}
      />
    </>
  );
};

export const EditPatientScreen = ({ route }): ReactElement => {
  const navigation = useNavigation();
  const { patientName } = route.params;
  const onGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <FullView background={theme.colors.BACKGROUND_GREY}>
      <StatusBar barStyle="light-content" />
      <StackHeader title="Cambodia Edit Patient" subtitle={patientName} onGoBack={onGoBack} />
      <PatientPersonalInfoForm isEdit fields={<Fields />} />
    </FullView>
  );
};
