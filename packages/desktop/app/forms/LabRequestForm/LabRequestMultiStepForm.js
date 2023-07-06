import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { LAB_REQUEST_FORM_TYPES } from '@tamanu/shared/constants/labs';
import { useAuth } from '../../contexts/Auth';

import { MultiStepForm, FormStep } from '../MultiStepForm';
import { LabRequestFormScreen1, screen1ValidationSchema } from './LabRequestFormScreen1';
import { LabRequestFormScreen2, screen2ValidationSchema } from './LabRequestFormScreen2';
import { LabRequestFormScreen3 } from './LabRequestFormScreen3';

const combinedValidationSchema = screen1ValidationSchema.concat(screen2ValidationSchema);

export const LabRequestMultiStepForm = ({
  isSubmitting,
  practitionerSuggester,
  departmentSuggester,
  specimenTypeSuggester,
  labSampleSiteSuggester,
  encounter,
  onCancel,
  onChangeStep,
  onSubmit,
  editedObject,
}) => {
  const { currentUser } = useAuth();
  const [initialSamples, setInitialSamples] = useState([]);

  return (
    <MultiStepForm
      onCancel={onCancel}
      onChangeStep={onChangeStep}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      initialValues={{
        requestFormType: LAB_REQUEST_FORM_TYPES.INDIVIDUAL,
        requestedById: currentUser.id,
        departmentId: encounter.departmentId,
        requestedDate: getCurrentDateTimeString(),
        labTestTypeIds: [],
        panelIds: [],
        notes: '',
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
        <LabRequestFormScreen2
          onSelectionChange={samples => {
            setInitialSamples(samples);
          }}
        />
      </FormStep>
      <FormStep submitButtonText="Finalise">
        <LabRequestFormScreen3
          practitionerSuggester={practitionerSuggester}
          specimenTypeSuggester={specimenTypeSuggester}
          labSampleSiteSuggester={labSampleSiteSuggester}
          initialSamples={initialSamples}
        />
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
