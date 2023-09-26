import React, { ReactElement, useCallback, useRef } from 'react';
import { Form } from '../Form';
import { FormScreenView } from '/components/Forms/FormScreenView';
import { PatientAdditionalDataFields } from './PatientAdditionalDataFields';
import {
  patientAdditionalDataValidationSchema,
  getInitialAdditionalValues,
  getInitialCustomValues,
} from './helpers';
import { PatientAdditionalData } from '~/models/PatientAdditionalData';
import { PatientFieldValue } from '~/models/PatientFieldValue';
import { Routes } from '~/ui/helpers/routes';
import { FormSectionHeading } from '../FormSectionHeading';
import { additionalDataSections } from '~/ui/helpers/additionalData';

export const PatientAdditionalDataForm = ({
  patientId,
  additionalData,
  navigation,
  sectionTitle,
  isCustomFields,
  customSectionFields,
  customPatientFieldValues,
}): ReactElement => {
  const scrollViewRef = useRef();
  // After save/update, the model will mark itself for upload and the
  // patient for sync (see beforeInsert and beforeUpdate decorators).
  const onCreateOrEditAdditionalData = useCallback(
    async values => {
      if (isCustomFields) {
        await Promise.all(
          Object.keys(values || {}).map(definitionId =>
            PatientFieldValue.updateOrCreateForPatientAndDefinition(
              patientId,
              definitionId,
              values[definitionId],
            )
          )
        );
      } else {
        await PatientAdditionalData.updateForPatient(patientId, values);
      }
      // Navigate back to patient details
      navigation.navigate(Routes.HomeStack.PatientDetailsStack.Index);
    },
    [navigation, isCustomFields],
  );

  // Get the actual additional data section object
  const section = isCustomFields ?
    { fields: customSectionFields.map(({ id, name, fieldType, options }) => ({ id, name, fieldType, options })) } :
    additionalDataSections.find(({ title }) => title === sectionTitle);
  const { fields } = section;

  return (
    <Form
      initialValues={isCustomFields ?
        getInitialCustomValues(customPatientFieldValues, fields) :
        getInitialAdditionalValues(additionalData, fields)
      }
      validationSchema={patientAdditionalDataValidationSchema}
      onSubmit={onCreateOrEditAdditionalData}
    >
      {({ handleSubmit, isSubmitting }): ReactElement => (
        <FormScreenView scrollViewRef={scrollViewRef}>
          <FormSectionHeading text={sectionTitle} />
          <PatientAdditionalDataFields
            handleSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            fields={fields}
            isCustomFields={isCustomFields}
          />
        </FormScreenView>
      )}
    </Form>
  );
};
