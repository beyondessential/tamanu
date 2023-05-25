import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { getCurrentDateString, getCurrentDateTimeString } from 'shared/utils/dateTime';
import { LAB_REQUEST_STATUSES, LAB_REQUEST_FORM_TYPES } from 'shared/constants/labs';
import { useAuth } from '../../contexts/Auth';

import { MultiStepForm, FormStep } from '../MultiStepForm';
import { LabRequestFormScreen1, screen1ValidationSchema } from './LabRequestFormScreen1';
import { LabRequestFormScreen2, screen2ValidationSchema } from './LabRequestFormScreen2';

const combinedValidationSchema = yup.object().shape({
  ...screen1ValidationSchema.fields,
  ...screen2ValidationSchema.fields,
});

export const LabRequestMultiStepForm = ({
  isSubmitting,
  practitionerSuggester,
  departmentSuggester,
  encounter,
  onCancel,
  onChangeStep,
  onSubmit,
  editedObject,
}) => {
  const { currentUser } = useAuth();

  return (
    <MultiStepForm
      onCancel={onCancel}
      onChangeStep={onChangeStep}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      initialValues={{
        requestFormType: LAB_REQUEST_FORM_TYPES.PANEL,
        requestedById: currentUser.id,
        departmentId: encounter.departmentId,
        requestedDate: getCurrentDateTimeString(),
        specimenAttached: 'no',
        status: LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED,
        labTestTypeIds: [],
        panelIds: [],
        notes: '',
        // LabTest date
        date: getCurrentDateString(),
        ...editedObject,
      }}
      validationSchema={combinedValidationSchema}
    >
      <FormStep validationSchema={screen1ValidationSchema}>
        <LabRequestFormScreen1
          practitionerSuggester={practitionerSuggester}
          departmentSuggester={departmentSuggester}
        />
      </FormStep>
      <FormStep validationSchema={screen2ValidationSchema} submitButtonText="Finalise">
        <LabRequestFormScreen2 />
      </FormStep>
    </MultiStepForm>
  );
};

LabRequestMultiStepForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  practitionerSuggester: PropTypes.object.isRequired,
  encounter: PropTypes.object,
  editedObject: PropTypes.object,
  isSubmitting: PropTypes.bool,
};

LabRequestMultiStepForm.defaultProps = {
  encounter: {},
  editedObject: {},
  isSubmitting: false,
};
