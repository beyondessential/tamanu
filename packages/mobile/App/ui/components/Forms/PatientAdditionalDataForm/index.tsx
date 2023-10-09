import React, { ReactElement, useCallback, useRef } from 'react';
import { theme } from '/styled/theme';
import { StyledView } from '/styled/common';
import { Form } from '../Form';
import { FormScreenView } from '/components/Forms/FormScreenView';
import { PatientAdditionalDataFields } from './PatientAdditionalDataFields';
import { patientAdditionalDataValidationSchema, getInitialValues } from './helpers';
import { PatientAdditionalData } from '~/models/PatientAdditionalData';
import { Routes } from '~/ui/helpers/routes';
import { FormSectionHeading } from '../FormSectionHeading';
import { additionalDataSections } from '~/ui/helpers/additionalData';
import { Button } from '../../Button';

export const PatientAdditionalDataForm = ({
  patientId,
  additionalData,
  navigation,
  sectionTitle,
}): ReactElement => {
  const scrollViewRef = useRef();
  // After save/update, the model will mark itself for upload and the
  // patient for sync (see beforeInsert and beforeUpdate decorators).
  const onCreateOrEditAdditionalData = useCallback(
    async values => {
      await PatientAdditionalData.updateForPatient(patientId, values);

      // Navigate back to patient details
      navigation.navigate(Routes.HomeStack.PatientDetailsStack.Index);
    },
    [navigation],
  );

  // Get the actual additional data section object
  const section = additionalDataSections.find(({ title }) => title === sectionTitle);
  const { fields } = section;

  return (
    <Form
      initialValues={getInitialValues(additionalData, fields)}
      validationSchema={patientAdditionalDataValidationSchema}
      onSubmit={onCreateOrEditAdditionalData}
    >
      {({ handleSubmit, isSubmitting }): ReactElement => (
        <FormScreenView scrollViewRef={scrollViewRef}>
          <FormSectionHeading text={sectionTitle} />
          <StyledView justifyContent="space-between">
            <PatientAdditionalDataFields fields={fields} showMandatory={false} />
            <Button
              backgroundColor={theme.colors.PRIMARY_MAIN}
              onPress={handleSubmit}
              loadingAction={isSubmitting}
              buttonText="Save"
              marginTop={10}
            />
          </StyledView>
        </FormScreenView>
      )}
    </Form>
  );
};
