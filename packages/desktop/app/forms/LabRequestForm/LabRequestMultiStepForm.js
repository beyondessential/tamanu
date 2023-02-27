import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { getCurrentDateString, getCurrentDateTimeString } from 'shared/utils/dateTime';
import { LAB_REQUEST_STATUSES } from 'shared/constants/labs';
import { useAuth } from '../../contexts/Auth';

import { MultiStepForm, FormStep } from '../MultiStepForm';
import { LabRequestFormScreen1, screen1ValidationSchema } from './LabRequestFormScreen1';
import { LabRequestFormScreen2, screen2ValidationSchema } from './LabRequestFormScreen2';

const combinedValidationSchema = yup.object().shape({
  ...screen1ValidationSchema.fields,
  ...screen2ValidationSchema.fields,
});

export const LabRequestMultiStepForm = ({
  practitionerSuggester,
  departmentSuggester,
  encounter,
  onSubmit,
  onCancel,
  editedObject,
  generateDisplayId,
}) => {
  const { currentUser } = useAuth();
  return (
    <MultiStepForm
      onCancel={onCancel}
      onSubmit={onSubmit}
      initialValues={{
        displayId: generateDisplayId(),
        requestedById: currentUser.id,
        departmentId: encounter.departmentId,
        requestedDate: getCurrentDateTimeString(),
        specimenAttached: 'no',
        status: LAB_REQUEST_STATUSES.NOT_COLLECTED,
        labTestIds: [],
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
      <FormStep validationSchema={screen2ValidationSchema}>
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
  generateDisplayId: PropTypes.func.isRequired,
  editedObject: PropTypes.object,
};

LabRequestMultiStepForm.defaultProps = {
  encounter: {},
  editedObject: {},
};
