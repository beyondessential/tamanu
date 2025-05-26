import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

import { CHARTING_DATA_ELEMENT_IDS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

import { Form, FormSubmitCancelRow, ModalLoader } from '../components';
import { SurveyScreen } from '../components/Surveys';
import { ForbiddenErrorModalContents } from '../components/ForbiddenErrorModal';
import { Modal } from '../components/Modal';
import { ErrorMessage } from '../components/ErrorMessage';
import { useAuth } from '../contexts/Auth';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useChartSurveyQuery } from '../api/queries/useChartSurveyQuery';
import { useTranslation } from '../contexts/Translation';
import { getValidationSchema } from '../utils';
import { useEncounter } from '../contexts/Encounter';

export const ChartForm = React.memo(({ patient, onSubmit, onClose, chartSurveyId }) => {
  const { getTranslation } = useTranslation();
  const { encounter } = useEncounter();
  const { data: chartSurvey, isLoading, isError, error } = useChartSurveyQuery(chartSurveyId);
  const { components = [] } = chartSurvey || {};
  const visibleComponents = components.filter(
    (c) => c.visibilityStatus === VISIBILITY_STATUSES.CURRENT,
  );
  const validationSchema = useMemo(
    () =>
      getValidationSchema({ components: visibleComponents }, getTranslation, {
        encounterType: encounter?.encounterType,
      }),
    [visibleComponents, encounter?.encounterType, getTranslation],
  );

  const { ability } = useAuth();
  const canCreateChart = ability.can('create', 'Charting');

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

  const handleSubmit = async (data) => onSubmit({ survey: chartSurvey, ...data });

  return (
    <Form
      onSubmit={handleSubmit}
      showInlineErrorsOnly
      validateOnChange
      validateOnBlur
      validationSchema={validationSchema}
      initialValues={{
        [CHARTING_DATA_ELEMENT_IDS.complexChartDate]: getCurrentDateTimeString(),
      }}
      render={({ submitForm, values, setFieldValue }) => (
        <SurveyScreen
          allComponents={visibleComponents}
          patient={patient}
          cols={2}
          values={values}
          setFieldValue={setFieldValue}
          submitButton={
            <FormSubmitCancelRow
              confirmText={<TranslatedText stringId="general.action.record" fallback="Record" />}
              onConfirm={submitForm}
              onCancel={onClose}
            />
          }
        />
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
