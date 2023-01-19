import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Alert, AlertTitle } from '@material-ui/lab';
import { Box } from '@material-ui/core';
import { VITALS_DATA_ELEMENT_IDS } from 'shared/constants';
import { getCurrentDateTimeString } from 'shared/utils/dateTime';
import { ModalLoader, ConfirmCancelRow, Form } from '../components';
import { SurveyScreen } from '../components/Surveys';
import { useVitalsSurvey } from '../api/queries';
import { getValidationSchema } from '../utils';
import { ForbiddenError } from '../components/ForbiddenErrorModal';
import { Modal } from '../components/Modal';
import { useAuth } from '../contexts/Auth';

const ErrorMessage = () => {
  return (
    <Box p={5} mb={4}>
      <Alert severity="error">
        <AlertTitle>Error: Cannot load vitals form</AlertTitle>
        Please contact a Tamanu Administrator to ensure the Vitals form is configured correctly.
      </Alert>
    </Box>
  );
};

export const VitalsForm = React.memo(({ patient, onSubmit, onClose, editedObject }) => {
  const { data: vitalsSurvey, isLoading, isError } = useVitalsSurvey();
  const validationSchema = useMemo(() => getValidationSchema(vitalsSurvey), [vitalsSurvey]);
  const { ability } = useAuth();
  const canCreateVitals = ability.can('create', 'Vitals');

  if (isLoading) {
    return <ModalLoader />;
  }

  if (!canCreateVitals) {
    return (
      <Modal title="Permission required" open onClose={onClose}>
        <ForbiddenError onConfirm={onClose} confirmText="Close" />
      </Modal>
    );
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
      validationSchema={validationSchema}
      initialValues={{
        [VITALS_DATA_ELEMENT_IDS.dateRecorded]: getCurrentDateTimeString(),
        ...editedObject,
      }}
      validate={({ [VITALS_DATA_ELEMENT_IDS.dateRecorded]: date, ...values }) => {
        const errors = {};

        // All readings are either numbers or strings
        if (!Object.values(values).some(x => ['number', 'string'].includes(typeof x))) {
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
