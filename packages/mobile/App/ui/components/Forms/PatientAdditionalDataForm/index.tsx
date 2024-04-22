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
import { isCustomField } from '~/ui/helpers/fields';

export const PatientAdditionalDataForm = ({
  patient,
  additionalData,
  additionalDataSections,
  navigation,
  sectionTitle,
  customPatientFieldValues,
}): ReactElement => {
  const scrollViewRef = useRef();
  // After save/update, the model will mark itself for upload and the
  // patient for sync (see beforeInsert and beforeUpdate decorators).
  const onCreateOrEditAdditionalData = useCallback(
    async values => {
      await Patient.updateValues(patient.id, values); // TODO: this is delayed until you come back for some reason

      await PatientAdditionalData.updateForPatient(patient.id, values);

      const customFields = Object.keys(values).filter(isCustomField);
      await Promise.all(
        customFields.map(definitionId =>
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

  // Get the field group for this section of the additional data template
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
        // <FormScreenView scrollViewRef={scrollViewRef}>
          <StyledView justifyContent="space-between">
            <PatientAdditionalDataFields fields={fields} showMandatory={false} />
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
