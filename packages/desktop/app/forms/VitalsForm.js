import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Alert, AlertTitle } from '@material-ui/lab';
import { Box } from '@material-ui/core';
import { VITALS_DATA_ELEMENT_IDS } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { ModalLoader, FormSubmitCancelRow, Form } from '../components';
import { SurveyScreen } from '../components/Surveys';
import { useVitalsSurvey } from '../api/queries';
import { getFormInitialValues, getValidationSchema } from '../utils';
import { ForbiddenErrorModalContents } from '../components/ForbiddenErrorModal';
import { Modal } from '../components/Modal';
import { useAuth } from '../contexts/Auth';

// eslint-disable-next-line no-unused-vars
const ErrorMessage = ({ error }) => {
  return (
    <Box p={5} mb={4}>
      <Alert severity="error">
        <AlertTitle>Error: Cannot load vitals form</AlertTitle>
        Please contact a Tamanu Administrator to ensure the Vitals form is configured correctly.
      </Alert>
    </Box>
  );
};

export const VitalsForm = React.memo(({ patient, onSubmit, onClose }) => {
  const { data: vitalsSurvey, isLoading, isError, error } = useVitalsSurvey();
  const validationSchema = useMemo(() => getValidationSchema(vitalsSurvey), [vitalsSurvey]);
  const { ability } = useAuth();
  const canCreateVitals = ability.can('create', 'Vitals');

  if (isLoading) {
    return <ModalLoader />;
  }

  if (!canCreateVitals) {
    return (
      <Modal title="Permission required" open onClose={onClose}>
        <ForbiddenErrorModalContents onConfirm={onClose} confirmText="Close" />
      </Modal>
    );
  }

  if (isError) {
    return <ErrorMessage error={error} />;
  }

  const handleSubmit = data => onSubmit({ survey: vitalsSurvey, ...data });

  return (
    <Form
      onSubmit={handleSubmit}
      showInlineErrorsOnly
      validateOnChange
      validateOnBlur
      validationSchema={validationSchema}
      initialValues={{
        [VITALS_DATA_ELEMENT_IDS.dateRecorded]: getCurrentDateTimeString(),
        ...getFormInitialValues(vitalsSurvey.components, patient),
      }}
      validate={({ [VITALS_DATA_ELEMENT_IDS.dateRecorded]: date, ...values }) => {
        const errors = {};
        if (Object.values(values).every(x => x === '' || x === null || x === undefined)) {
          errors.form = 'At least one recording must be entered.';
        }

        return errors;
      }}
      render={({ submitForm, values, setFieldValue }) => (
        <SurveyScreen
          allComponents={vitalsSurvey.components}
          patient={patient}
          cols={2}
          values={values}
          setFieldValue={setFieldValue}
          submitButton={
            <FormSubmitCancelRow confirmText="Record" onConfirm={submitForm} onCancel={onClose} />
          }
        />
      )}
    />
  );
});

VitalsForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  patient: PropTypes.object.isRequired,
};
