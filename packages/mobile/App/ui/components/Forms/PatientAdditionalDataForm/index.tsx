import React, { ReactElement, useCallback, useRef } from 'react';
import { Form } from '../Form';
import { FormScreenView } from '/components/Forms/FormScreenView';
import { PatientAdditionalDataFields } from './PatientAdditionalDataFields';
import { patientAdditionalDataValidationSchema, getInitialValues } from './helpers';
import { PatientAdditionalData } from '~/models/PatientAdditionalData';
import { Routes } from '~/ui/helpers/routes';
import { FormSectionHeading } from '../FormSectionHeading';
import { additionalDataSections } from '~/ui/helpers/additionalData';

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
      // A user isn't guaranteed to have any additional data,
      // in which case it needs to be created.
      if (additionalData) {
        // Edit additional data
        await PatientAdditionalData.updateValues(additionalData.id, values);
      } else {
        // Create new empty additional data
        const newAdditionalData = await PatientAdditionalData.createAndSaveOne({
          patient: patientId,
        });

        // Update the newly created additional data to properly save relations
        // defined with 'IdRelation' and 'RelationId' decorators.
        await PatientAdditionalData.updateValues(newAdditionalData.id, values);
      }

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
          <PatientAdditionalDataFields
            handleSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            navigation={navigation}
            fields={fields}
          />
        </FormScreenView>
      )}
    </Form>
  );
};
