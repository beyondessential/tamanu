import React from 'react';
import PropTypes from 'prop-types';

import { VISIBILITY_STATUSES } from '@tamanu/constants';

import { Form, FormSubmitCancelRow, ModalLoader } from '../components';
import { SurveyScreen } from '../components/Surveys';
import { ForbiddenErrorModalContents } from '../components/ForbiddenErrorModal';
import { Modal } from '../components/Modal';
import { ErrorMessage } from '../components/ErrorMessage';
import { useAuth } from '../contexts/Auth';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useChartSurveyQuery } from '../api/queries/useChartSurveyQuery';

export const ChartForm = React.memo(({ patient, onSubmit, onClose, chartSurveyId }) => {
  const { data: chartSurvey, isLoading, isError, error } = useChartSurveyQuery(chartSurveyId);
  const { components = [] } = chartSurvey || {};
  const visibleComponents = components.filter(
    c => c.visibilityStatus === VISIBILITY_STATUSES.CURRENT,
  );

  const { ability } = useAuth();
  const canCreateChart = ability.can('create', 'Charting');

  if (isLoading) {
    return <ModalLoader />;
  }

  if (!canCreateChart) {
    return (
      <Modal title="Permission required" open onClose={onClose}>
        <ForbiddenErrorModalContents onConfirm={onClose} confirmText="Close" />
      </Modal>
    );
  }

  if (isError) {
    return (
      <ErrorMessage
        title="Error: Cannot load chart form"
        errorMessage="Please contact an administrator to ensure the Chart form is configured correctly."
        error={error}
      />
    );
  }

  const handleSubmit = async data => onSubmit({ survey: chartSurvey, ...data });

  return (
    <Form
      onSubmit={handleSubmit}
      showInlineErrorsOnly
      validateOnChange
      validateOnBlur
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
              confirmText={<TranslatedText
                stringId="general.action.record"
                fallback="Record"
                data-testid='translatedtext-is78' />}
              onConfirm={submitForm}
              onCancel={onClose}
              data-testid='formsubmitcancelrow-fu17' />
          }
        />
        </>
        
      )}
    />
  );
});

ChartForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  patient: PropTypes.object.isRequired,
  chartSurveyId: PropTypes.string.isRequired,
};
