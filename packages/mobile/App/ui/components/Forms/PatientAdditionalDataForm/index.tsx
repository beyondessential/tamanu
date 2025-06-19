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
import { CustomPatientFieldValues } from '~/ui/hooks/usePatientAdditionalData';
import { NavigationProp } from '@react-navigation/native';
import { compose } from 'redux';
import { withPatient } from '~/ui/containers/Patient';

interface PatientAdditionalDataFormProps {
  patient: Patient;
  additionalData: PatientAdditionalData;
  additionalDataSections: any;
  navigation: NavigationProp<any>;
  sectionTitle: string;
  customPatientFieldValues: CustomPatientFieldValues;
  isCustomSection?: boolean;
  customSectionFields?: any[];
  sectionKey: Element;
  setSelectedPatient: (patient: Patient) => void;
}

export const PatientAdditionalDataForm = compose(withPatient)(({
  patient,
  additionalData,
  additionalDataSections,
  navigation,
  sectionKey,
  customPatientFieldValues,
  isCustomSection = false,
  customSectionFields,
  setSelectedPatient,
}: PatientAdditionalDataFormProps): ReactElement => {
  const scrollViewRef = useRef();
  // After save/update, the model will mark itself for upload and the
  // patient for sync (see beforeInsert and beforeUpdate decorators).
  const onCreateOrEditAdditionalData = useCallback(
    async (values) => {
      const customPatientFieldDefinitions = await PatientFieldDefinition.findVisible({
        relations: ['category'],
        order: {
          // Nested ordering only works with typeorm version > 0.3.0
          // category: { name: 'DESC' },
          name: 'DESC',
        },
      });

      // Specifically for the case where village is within a hierarchy field in the PAD form
      const updatedPatient = await Patient.updateValues(patient.id, {
        villageId: values?.villageId || null,
      });

      const sanitizedValues = Object.fromEntries(
        Object.entries(values).map(([key, value]) => [key, value === '' ? null : value]),
      );

      await PatientAdditionalData.updateForPatient(patient.id, sanitizedValues);

      // Update any custom field definitions contained in this form
      const customValuesToUpdate = Object.keys(values).filter((key) =>
        customPatientFieldDefinitions.map(({ id }) => id).includes(key),
      );
      await Promise.all(
        customValuesToUpdate.map((definitionId) =>
          PatientFieldValue.updateOrCreateForPatientAndDefinition(
            patient.id,
            definitionId,
            values[definitionId],
          ),
        ),
      );

      setSelectedPatient(updatedPatient);

      // Navigate back to patient details
      navigation.navigate(Routes.HomeStack.PatientDetailsStack.Index);
    },
    [navigation, patient.id, setSelectedPatient],
  );

  // Get the field group for this section of the additional data template
  const { fields } = isCustomSection
    ? {
        fields: customSectionFields.map(({ id, name, fieldType, options }) => ({
          id,
          name,
          fieldType,
          options,
        })),
      }
    : additionalDataSections.find(({ sectionKey: key }) => key === sectionKey);
  const initialAdditionalData = getInitialAdditionalValues(additionalData, fields);
  const initialCustomValues = getInitialCustomValues(customPatientFieldValues, fields);

  return (
    <Form
      initialValues={{
        ...initialAdditionalData,
        ...initialCustomValues,
        ...patient,
      }}
      validationSchema={patientAdditionalDataValidationSchema}
      onSubmit={onCreateOrEditAdditionalData}
    >
      {(): ReactElement => (
        <FormScreenView scrollViewRef={scrollViewRef}>
          <StyledView justifyContent="space-between">
            <PatientAdditionalDataFields
              fields={fields}
              isCustomSection={isCustomSection}
              showMandatory={false}
            />
            <SubmitButton
              buttonText={<TranslatedText stringId="general.action.save" fallback="Save" />}
              marginTop={10}
            />
          </StyledView>
        </FormScreenView>
      )}
    </Form>
  );
});
