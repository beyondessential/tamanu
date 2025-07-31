import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { subject } from '@casl/ability';

import { VISIBILITY_STATUSES } from '@tamanu/constants';

import { Form, FormSubmitCancelRow, ModalLoader } from '../components';
import { SurveyScreen } from '../components/Surveys';
import { ForbiddenErrorModalContents } from '../components/ForbiddenErrorModal';
import { Modal } from '../components/Modal';
import { ErrorMessage } from '../components/ErrorMessage';
import { useAuth } from '../contexts/Auth';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useChartSurveyQuery } from '../api/queries/useChartSurveyQuery';
import { getFormInitialValues, getValidationSchema } from '../utils';
import { usePatientAdditionalDataQuery } from '../api/queries';
import { combineQueries } from '../api';
import { useTranslation } from '../contexts/Translation';

export const ChartForm = React.memo(({ patient, onSubmit, onClose, chartSurveyId }) => {
  const { currentUser } = useAuth();
  const { getTranslation } = useTranslation();
  const chartSurveyQuery = useChartSurveyQuery(chartSurveyId);
  const patientAdditionalDataQuery = usePatientAdditionalDataQuery(patient?.id);
  const {
    data: [chartSurveyData, patientAdditionalData],
    isLoading,
    isError,
    error,
  } = combineQueries([chartSurveyQuery, patientAdditionalDataQuery]);

  const { components = [] } = chartSurveyData || {};
  const visibleComponents = components.filter(
    c => c.visibilityStatus === VISIBILITY_STATUSES.CURRENT,
  );

  const { ability } = useAuth();
  const canCreateChart = ability.can('create', subject('Charting', { id: chartSurveyId }));

  const initialValues = useMemo(
    () => getFormInitialValues(
    visibleComponents,
    patient,
    patientAdditionalData,
    currentUser,
  ), [visibleComponents, patient, patientAdditionalData, currentUser]);

  const validationSchema = useMemo(
    () => getValidationSchema(chartSurveyData, getTranslation),
    [chartSurveyData, getTranslation],
  );

  if (isLoading) {
    return <ModalLoader data-testid="modalloader-wncd" />;
  }

  if (!canCreateChart) {
    return (
      <Modal title="Permission required" open onClose={onClose} data-testid="modal-inaz">
        <ForbiddenErrorModalContents
          onConfirm={onClose}
          confirmText="Close"
          data-testid="forbiddenerrormodalcontents-nafx"
        />
      </Modal>
    );
  }

  if (isError) {
    return (
      <ErrorMessage
        title="Error: Cannot load chart form"
        errorMessage="Please contact an administrator to ensure the Chart form is configured correctly."
        error={error}
        data-testid="errormessage-k6hd"
      />
    );
  }

  const handleSubmit = async data => onSubmit({ survey: chartSurveyData, ...data });

  return (
    <Form
      onSubmit={handleSubmit}
      showInlineErrorsOnly
      validateOnChange
      validateOnBlur
      validationSchema={validationSchema}
      initialValues={initialValues}
      render={({ submitForm, values, setFieldValue }) => (
        <>
          <SurveyScreen
            allComponents={visibleComponents}
            patient={patient}
            cols={2}
            values={values}
            setFieldValue={setFieldValue}
            submitButton={
              <FormSubmitCancelRow
                confirmText={
                  <TranslatedText
                    stringId="general.action.record"
                    fallback="Record"
                    data-testid="translatedtext-6dm3"
                  />
                }
                onConfirm={submitForm}
                onCancel={onClose}
                data-testid="formsubmitcancelrow-1ah9"
              />
            }
            data-testid="surveyscreen-ek46"
          />
        </>
      )}
      data-testid="form-v82r"
    />
  );
});

ChartForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  patient: PropTypes.object.isRequired,
  chartSurveyId: PropTypes.string.isRequired,
};
