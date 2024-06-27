import React, { ReactElement, useCallback, useRef } from 'react';
import { StyledView } from '/styled/common';
import { Form } from '../Form';
import { PatientAdditionalDataFields } from './PatientAdditionalDataFields';
import {
  getInitialAdditionalValues,
  getInitialCustomValues,
  patientAdditionalDataValidationSchema,
} from './helpers';
import { PatientAdditionalData } from '~/models/PatientAdditionalData';
import { PatientFieldValue } from '~/models/PatientFieldValue';
import { Patient } from '~/models/Patient';
import { Routes } from '~/ui/helpers/routes';
import { SubmitButton } from '../SubmitButton';
import { TranslatedText } from '/components/Translations/TranslatedText';
import { FormScreenView } from '../FormScreenView';
import { PatientFieldDefinition } from '~/models/PatientFieldDefinition';
import { Text } from 'react-native-paper';

export const PatientAdditionalDataForm = ({
  patient,
  additionalData,
  additionalDataSections,
  navigation,
  sectionTitle,
  customPatientFieldValues,
  isCustomFields = false,
  customSectionFields,
}): ReactElement => {
  const scrollViewRef = useRef();
  // After save/update, the model will mark itself for upload and the
  // patient for sync (see beforeInsert and beforeUpdate decorators).
  const onCreateOrEditAdditionalData = useCallback(
    async values => {
      const customPatientFieldDefinitions = await PatientFieldDefinition.findVisible({
        relations: ['category'],
        order: {
          // Nested ordering only works with typeorm version > 0.3.0
          // category: { name: 'DESC' },
          name: 'DESC',
        },
      });

      await Patient.updateValues(patient.id, values);

      await PatientAdditionalData.updateForPatient(patient.id, values);

      // Update any custom field definitions contained in this form
      const customValuesToUpdate = Object.keys(values).filter(key =>
        customPatientFieldDefinitions.map(({ id }) => id).includes(key),
      );
      await Promise.all(
        customValuesToUpdate.map(definitionId =>
          PatientFieldValue.updateOrCreateForPatientAndDefinition(
            patient.id,
            definitionId,
            values[definitionId],
          ),
        ),
      );

      // Navigate back to patient details
      navigation.navigate(Routes.HomeStack.PatientDetailsStack.Index);
    },
    [navigation, patient.id],
  );

  const section = isCustomFields
    ? {
        fields: customSectionFields.map(({ id, name, fieldType, options }) => ({
          id,
          name,
          fieldType,
          options,
        })),
      }
    : additionalDataSections.find(({ title }) => title === sectionTitle)

  const { fields } = section;

  return (
    <Form
      initialValues={{
        ...getInitialAdditionalValues(additionalData, fields),
        ...getInitialCustomValues(customPatientFieldValues, fields),
        ...patient
      }}
      validationSchema={patientAdditionalDataValidationSchema}
      onSubmit={onCreateOrEditAdditionalData}
    >
      {(): ReactElement => (
        <FormScreenView scrollViewRef={scrollViewRef}>
          <StyledView justifyContent="space-between">
            <Text>isCustomFields: {isCustomFields}</Text>
            <Text>section: {JSON.stringify(section)}</Text>
            {/* <Text>{JSON.stringify(fields)}</Text> */}
            <PatientAdditionalDataFields fields={fields} showMandatory={false} />
            <SubmitButton
              buttonText={<TranslatedText stringId="general.action.save" fallback="Save" />}
              marginTop={10}
            />
          </StyledView>
        </FormScreenView>
      )}
    </Form>
  );
};
