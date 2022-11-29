import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { Alert, AlertTitle } from '@material-ui/lab';
import { Box } from '@material-ui/core';
import { getCurrentDateTimeString } from 'shared/utils/dateTime';
import { ModalLoader, ConfirmCancelRow, Form } from '../components';
import { SurveyScreen } from '../components/Surveys';
import { useVitalsSurvey } from '../api/queries';

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

const ErrorMessage = () => {
  return (
    <Box p={5} mb={4}>
      <Alert severity="error">
        <AlertTitle>Error: Can not load vitals form</AlertTitle>
        Please contact a Tamanu Administrator to ensure the Vitals form is configured correctly.
      </Alert>
    </Box>
  );
};

export const VitalsForm = React.memo(({ patient, onSubmit, onClose, editedObject }) => {
  const { data: vitalsSurvey, isLoading, isError } = useVitalsSurvey();

  if (isLoading) {
    return <ModalLoader />;
  }

  if (isError) {
    return <ErrorMessage />;
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
  patient: PropTypes.object.isRequired,
  editedObject: PropTypes.shape({}),
};

VitalsForm.defaultProps = {
  editedObject: null,
};
