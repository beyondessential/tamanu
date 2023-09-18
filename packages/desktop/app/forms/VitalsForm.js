import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { VITALS_DATA_ELEMENT_IDS } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { ModalLoader, ConfirmCancelRow, Form } from '../components';
import { SurveyScreen } from '../components/Surveys';
import { combineQueries } from '../api/combineQueries';
import { useVitalsSurveyQuery, usePatientAdditionalDataQuery } from '../api/queries';
import { getFormInitialValues, getValidationSchema } from '../utils';
import { ForbiddenErrorModalContents } from '../components/ForbiddenErrorModal';
import { Modal } from '../components/Modal';
import { ErrorMessage } from '../components/ErrorMessage';
import { useAuth } from '../contexts/Auth';

export const VitalsForm = React.memo(({ patient, onSubmit, onClose }) => {
  const {
    data: [vitalsSurvey, patientAdditionalData],
    isLoading,
    isError,
    error,
  } = combineQueries([useVitalsSurveyQuery(), usePatientAdditionalDataQuery()]);
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
    return (
      <ErrorMessage
        title="Error: Cannot load vitals form"
        errorMessage="Please contact a Tamanu Administrator to ensure the Vitals form is configured correctly."
        error={error}
      />
    );
  }

  const handleSubmit = data => {
    onSubmit({ survey: vitalsSurvey, ...data });
  };

  return (
    <Form
      onSubmit={handleSubmit}
      showInlineErrorsOnly
      validateOnChange
      validateOnBlur
      validationSchema={validationSchema}
      initialValues={{
        [VITALS_DATA_ELEMENT_IDS.dateRecorded]: getCurrentDateTimeString(),
        ...getFormInitialValues(vitalsSurvey.components, patient, patientAdditionalData),
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
            <ConfirmCancelRow confirmText="Record" onConfirm={submitForm} onCancel={onClose} />
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
