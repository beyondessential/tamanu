import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { subject } from '@casl/ability';

import {
  getFormInitialValues,
  getValidationSchema,
  Form,
  FormSubmitCancelRow,
  SurveyScreen,
  Modal,
  ModalLoader,
  useDateTimeFormat,
} from '@tamanu/ui-components';
import { VISIBILITY_STATUSES, CHARTING_DATA_ELEMENT_IDS } from '@tamanu/constants';

import { ForbiddenErrorModalContents } from '../components/ForbiddenErrorModal';
import { ErrorMessage } from '../components/ErrorMessage';
import { useAuth } from '../contexts/Auth';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useSurveyQuery } from '../api/queries/useSurveyQuery';
import { usePatientAdditionalDataQuery } from '../api/queries';
import { combineQueries } from '../api';
import { useTranslation } from '../contexts/Translation';
import { useEncounter } from '../contexts/Encounter.jsx';
import { getComponentForQuestionType } from '../components/Surveys/getComponentForQuestionType.jsx';

export const ChartForm = React.memo(
  ({
    patient,
    onSubmit,
    onClose,
    chartSurveyId,
    editedObject = {},
    confirmText = (
      <TranslatedText
        stringId="general.action.record"
        fallback="Record"
        data-testid="translatedtext-6dm3"
      />
    ),
  }) => {
    const { currentUser, ability } = useAuth();
    const { encounter } = useEncounter();
    const { getTranslation } = useTranslation();
    const { getCurrentDateTime } = useDateTimeFormat();
    const chartSurveyQuery = useSurveyQuery(chartSurveyId);
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

    const canCreateChart = ability.can('create', subject('Charting', { id: chartSurveyId }));

    const initialValues = useMemo(() => {
      const formInitialValues = getFormInitialValues({
        components: visibleComponents,
        additionalData: patientAdditionalData,
        patient,
        currentUser,
        getCurrentDateTime,
      });

      const hasPatientChartingDate = visibleComponents.some(
        c => c.dataElement?.id === CHARTING_DATA_ELEMENT_IDS.dateRecorded,
      );

      return {
        ...(hasPatientChartingDate && {
          [CHARTING_DATA_ELEMENT_IDS.dateRecorded]: getCurrentDateTime(),
        }),
        ...formInitialValues,
        ...editedObject,
      };
    }, [
      visibleComponents,
      patient,
      patientAdditionalData,
      currentUser,
      editedObject,
      getCurrentDateTime,
    ]);
    const validationSchema = useMemo(() => getValidationSchema(chartSurveyData, getTranslation), [
      chartSurveyData,
      getTranslation,
    ]);

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
              encounterType={encounter?.encounterType}
              getComponentForQuestionType={getComponentForQuestionType}
              submitButton={
                <FormSubmitCancelRow
                  confirmText={confirmText}
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
  },
);

ChartForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  patient: PropTypes.object.isRequired,
  chartSurveyId: PropTypes.string.isRequired,
};
