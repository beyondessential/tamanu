import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { useQuery } from '@tanstack/react-query';
import { getCurrentDateTimeString } from 'shared/utils/dateTime';
import { ConfirmCancelRow, Form } from '../components';
import { SurveyScreen } from '../components/Surveys';
import { useApi } from '../api';

const useVitalsSurvey = () => {
  const api = useApi();
  // Todo: update to use vitals survey endpoint
  const VITALS_SURVEY_ID = 'program-patientvitals-patientvitals';

  return useQuery(['survey', { type: 'vitals' }], () =>
    api.get(`survey/${encodeURIComponent(VITALS_SURVEY_ID)}`),
  );
};

const COLUMNS_TO_DATA_ELEMENT_ID = {
  dateRecorded: 'pde-PatientVitalsDate',
  temperature: 'pde-PatientVitalsTemperature',
  weight: 'pde-PatientVitalsWeight',
  height: 'pde-PatientVitalsHeight',
  sbp: 'pde-PatientVitalsSBP',
  dbp: 'pde-PatientVitalsDBP',
  heartRate: 'pde-PatientVitalsHeartRate',
  respiratoryRate: 'pde-PatientVitalsRespiratoryRate',
  spo2: 'pde-PatientVitalsSPO2',
  avpu: 'pde-PatientVitalsAVPU',
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
      validationSchema={yup.object().shape({
        [COLUMNS_TO_DATA_ELEMENT_ID.dateRecorded]: yup.date().required(),
      })}
      initialValues={{
        [COLUMNS_TO_DATA_ELEMENT_ID.dateRecorded]: getCurrentDateTimeString(),
        ...editedObject,
      }}
      validate={({ [COLUMNS_TO_DATA_ELEMENT_ID.dateRecorded]: date, ...values }) => {
        const errors = {};

        // All readings are either numbers or strings
        if (!Object.values(values).some(x => x && ['number', 'string'].includes(typeof x))) {
          errors.form = 'At least one recording must be entered.';
        }

        return errors;
      }}
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
