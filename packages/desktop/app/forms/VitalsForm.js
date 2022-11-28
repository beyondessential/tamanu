import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import { ConfirmCancelRow, Form } from '../components';
import { SurveyScreen } from '../components/Surveys';
import { useApi } from '../api';

// Todo: update survey id
const VITALS_SURVEY_ID = 'program-patientvitals-patientvitals';

// Todo: make generic for surveys
const useVitalsSurvey = () => {
  const api = useApi();

  return useQuery(['survey', { type: 'vitals' }], () =>
    api.get(`survey/${encodeURIComponent(VITALS_SURVEY_ID)}`),
  );
};

export const VitalsForm = React.memo(({ patient, onSubmit, onClose, editedObject }) => {
  const { data: vitalsSurvey, isLoading } = useVitalsSurvey();

  if (isLoading) {
    return 'Loading...';
  }

  const handleSubmit = data => {
    onSubmit({ survey: vitalsSurvey, ...data });
  };

  return (
    <Form
      onSubmit={handleSubmit}
      initialValues={editedObject}
      render={({ submitForm }) => {
        return (
          <SurveyScreen
            components={vitalsSurvey.components}
            patient={patient}
            cols={2}
            submitButton={
              <ConfirmCancelRow confirmText="Record" onConfirm={submitForm} onCancel={onClose} />
            }
          />
        );
      }}
    />
  );
});

VitalsForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  patient: PropTypes.func.isRequired,
  editedObject: PropTypes.shape({}),
};

VitalsForm.defaultProps = {
  editedObject: null,
};
