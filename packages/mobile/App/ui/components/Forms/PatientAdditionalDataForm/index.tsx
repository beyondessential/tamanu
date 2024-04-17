import React, { ReactElement, useCallback, useRef } from 'react';
import { StyledView } from '/styled/common';
import { Form } from '../Form';
import { FormScreenView } from '/components/Forms/FormScreenView';
import { PatientAdditionalDataFields } from './PatientAdditionalDataFields';
import {
  getInitialAdditionalValues,
  getInitialCustomValues,
  patientAdditionalDataValidationSchema,
} from './helpers';
import { PatientAdditionalData } from '~/models/PatientAdditionalData';
import { PatientFieldValue } from '~/models/PatientFieldValue';
import { Routes } from '~/ui/helpers/routes';
import { SubmitButton } from '../SubmitButton';
import { TranslatedText } from '/components/Translations/TranslatedText';

export const PatientAdditionalDataForm = ({
  patient,
  additionalData,
  additionalDataSections,
  navigation,
  sectionTitle,
  isCustomFields,
  customPatientFieldValues,
}): ReactElement => {
  const scrollViewRef = useRef();
  // After save/update, the model will mark itself for upload and the
  // patient for sync (see beforeInsert and beforeUpdate decorators).
  // TODO: implement this, update by field instead of by section
  const onCreateOrEditAdditionalData = useCallback(
    async values => {
      if (isCustomFields) {
        await Promise.all(
          Object.keys(values || {}).map(definitionId =>
            PatientFieldValue.updateOrCreateForPatientAndDefinition(
              patient.id,
              definitionId,
              values[definitionId],
            ),
          ),
        );
      } else {
        await PatientAdditionalData.updateForPatient(patient.id, values);
      }
      // Navigate back to patient details
      navigation.navigate(Routes.HomeStack.PatientDetailsStack.Index);
    },
    [navigation, isCustomFields],
  );

  // Get the actual additional data section object
  const { fields } = additionalDataSections.find(({ title }) => title === sectionTitle);

  return (
    <Form
      initialValues={{
        ...patient,
        ...getInitialAdditionalValues(additionalData, fields),
        ...getInitialCustomValues(customPatientFieldValues, fields),
      }}
      validationSchema={patientAdditionalDataValidationSchema} // TODO: handle the new validation
      onSubmit={onCreateOrEditAdditionalData}
    >
      {(): ReactElement => (
        // <FormScreenView scrollViewRef={scrollViewRef}> TODO: why is this bugging out on "interpolate"
        <StyledView justifyContent="space-between">
          <PatientAdditionalDataFields
            fields={fields}
            showMandatory={false}
          />
          <SubmitButton
            buttonText={<TranslatedText stringId="general.action.save" fallback="Save" />}
            marginTop={10}
          />
        </StyledView>
        // </FormScreenView>
      )}
    </Form>
  );
};
