import React, { ReactElement, useCallback, useRef } from 'react';
import { keyBy } from 'lodash';
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
import { useBackendEffect } from '~/ui/hooks';

const useLocationInitialValues = (data, fields) => {
  const [hierarchy, error, loading] = useBackendEffect(async ({ models }) => {
    const entity = await models.ReferenceData.getNode({
      id: data.secondaryVillageId,
    });
    const ancestors = await entity?.getAncestors();
    return [...ancestors, entity];
  });
  if (!data) {
    return {};
  }

  const hierarchyByType = keyBy(hierarchy, 'type');

  const values = {};
  fields.forEach(field => {
    if (field === 'cambodiaSecondaryVillageId') {
      values['secondaryVillageId'] = data.secondaryVillageId;
      values['secondaryDivisionId'] = hierarchyByType['division']?.id;
      values['secondarySubdivisionId'] = hierarchyByType['subdivision']?.id;
      values['secondarySettlementId'] = hierarchyByType['settlement']?.id;
    }
  });

  return [values, error, loading];
};

export const PatientAdditionalDataForm = ({
  patient,
  additionalData,
  additionalDataSections,
  navigation,
  sectionKey,
  customPatientFieldValues,
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

  // Get the field group for this section of the additional data template
  const { fields } = additionalDataSections.find(({ sectionKey: key }) => key === sectionKey);
  const [locationInitialValues, error, loading] = useLocationInitialValues(additionalData, fields);
  const initialAdditionalData = getInitialAdditionalValues(additionalData, fields);
  const initialCustomValues = getInitialCustomValues(customPatientFieldValues, fields);

  if (loading) {
    return (
      <StyledView justifyContent="center">
        <TranslatedText stringId="general.loading" fallback="Loading..." />
      </StyledView>
    );
  }

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
