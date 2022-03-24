import React, { ReactElement, useCallback, useRef } from 'react';
import { Form } from '../Form';
import { FormScreenView } from '/components/Forms/FormScreenView';
import { PatientAdditionalDataFields } from './PatientAdditionalDataFields';
import { patientAdditionalDataValidationSchema, getInitialValues } from './helpers';
import { PatientAdditionalData } from '~/models/PatientAdditionalData';
import { Routes } from '~/ui/helpers/routes';

export const PatientAdditionalDataForm = ({
  patientId,
  additionalData,
  navigation,
}): ReactElement => {
  const scrollViewRef = useRef();
  const onCreateOrEditAdditionalData = useCallback(async (values) => {
    // A user isn't guaranteed to have any additional data,
    // in which case it needs to be created.
    if (additionalData) {
      // Edit additional data
      const editedAdditionalData = await PatientAdditionalData.findOne(additionalData.id);

      // Update each value used on the form
      Object.entries(values).forEach(([key, value]) => {
        editedAdditionalData[key] = value;
      });

      // Save() call will mark the model for upload and the patient for sync
      await editedAdditionalData.save();
    } else {
      // Create additional data and mark it for upload. Creating a new one will
      // automatically mark the patient for sync.
      await PatientAdditionalData.createAndSaveOne({
        ...values,
        patient: patientId,
        markedForUpload: true,
      });
    }

    // Navigate back to patient details
    navigation.navigate(Routes.HomeStack.PatientDetailsStack.Index);
  }, [navigation]);

  return (
    <Form
      initialValues={getInitialValues(additionalData)}
      validationSchema={patientAdditionalDataValidationSchema}
      onSubmit={onCreateOrEditAdditionalData}
    >
      {({ handleSubmit, isSubmitting }): ReactElement => (
        <FormScreenView scrollViewRef={scrollViewRef}>
          <PatientAdditionalDataFields
            handleSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            navigation={navigation}
          />
        </FormScreenView>
      )}
    </Form>
  );
};
