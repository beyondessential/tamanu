import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import {
  getFormInitialValues,
  getValidationSchema,
  Form,
  FormSubmitCancelRow,
  SurveyScreen,
  Modal,
  ModalLoader,
  TranslatedText,
  useDateTimeFormat,
} from '@tamanu/ui-components';
import { VISIBILITY_STATUSES, VITALS_DATA_ELEMENT_IDS } from '@tamanu/constants';
import { combineQueries } from '../api/combineQueries';
import { usePatientAdditionalDataQuery, useVitalsSurveyQuery } from '../api/queries';
import { ForbiddenErrorModalContents } from '../components/ForbiddenErrorModal';
import { ErrorMessage } from '../components/ErrorMessage';
import { useAuth } from '../contexts/Auth';
import { useEncounter } from '../contexts/Encounter';
import { useTranslation } from '../contexts/Translation';
import { getComponentForQuestionType } from '../components/Surveys';

export const VitalsForm = React.memo(({ patient, onSubmit, onClose, encounterType }) => {
  const { getTranslation } = useTranslation();
  const { getCurrentDateTimeString } = useDateTimeFormat();
  const {
    data: [vitalsSurvey, patientAdditionalData],
    isLoading,
    isError,
    error,
  } = combineQueries([useVitalsSurveyQuery(), usePatientAdditionalDataQuery(patient.id)]);
  const { encounter } = useEncounter();
  const { components = [] } = vitalsSurvey || {};
  const currentComponents = components
    .filter(c => c.visibilityStatus === VISIBILITY_STATUSES.CURRENT)
    .map(c =>
      c.dataElementId === VITALS_DATA_ELEMENT_IDS.dateRecorded
        ? { ...c, validationCriteria: JSON.stringify({ mandatory: true }) }
        : c,
    );
  const validationSchema = useMemo(
    () =>
      getValidationSchema({ components: currentComponents }, getTranslation, {
        encounterType: encounterType || encounter?.encounterType,
      }).concat(
        yup.object().shape({
          [VITALS_DATA_ELEMENT_IDS.dateRecorded]: yup
            .date()
            .translatedLabel(
              <TranslatedText
                stringId="general.recordedDate.label"
                fallback="Date recorded"
                data-testid="translatedtext-6iti"
              />,
            )
            .required(),
        }),
      ),
    [currentComponents, encounter?.encounterType, encounterType, getTranslation],
  );
  const { ability } = useAuth();
  const canCreateVitals = ability.can('create', 'Vitals');

  if (isLoading) {
    return <ModalLoader data-testid="modalloader-328q" />;
  }

  if (!canCreateVitals) {
    return (
      <Modal title="Permission required" open onClose={onClose} data-testid="modal-08wo">
        <ForbiddenErrorModalContents
          onConfirm={onClose}
          confirmText="Close"
          data-testid="forbiddenerrormodalcontents-5ntb"
        />
      </Modal>
    );
  }

  if (isError) {
    return (
      <ErrorMessage
        title="Error: Cannot load vitals form"
        errorMessage="Please contact an administrator to ensure the Vitals form is configured correctly."
        error={error}
        data-testid="errormessage-s5wr"
      />
    );
  }

  const handleSubmit = async data => onSubmit({ survey: vitalsSurvey, ...data });

  return (
    <Form
      onSubmit={handleSubmit}
      showInlineErrorsOnly
      validateOnChange
      validateOnBlur
      validationSchema={validationSchema}
      initialValues={{
        [VITALS_DATA_ELEMENT_IDS.dateRecorded]: getCurrentDateTimeString(),
        ...getFormInitialValues(currentComponents, patient, patientAdditionalData),
      }}
      validate={values => {
        if (
          Object.entries(values)
            .filter(([name]) => name !== VITALS_DATA_ELEMENT_IDS.dateRecorded)
            .every(([, value]) => value === '' || value === null || value === undefined)
        ) {
          return { form: 'At least one recording must be entered.' };
        }

        return {};
      }}
      render={({ submitForm, values, setFieldValue }) => (
        <SurveyScreen
          allComponents={currentComponents}
          patient={patient}
          cols={2}
          values={values}
          setFieldValue={setFieldValue}
          getComponentForQuestionType={getComponentForQuestionType}
          submitButton={
            <FormSubmitCancelRow
              confirmText={
                <TranslatedText
                  stringId="general.action.record"
                  fallback="Record"
                  data-testid="translatedtext-rn5f"
                />
              }
              onConfirm={submitForm}
              onCancel={onClose}
              data-testid="formsubmitcancelrow-vzf5"
            />
          }
          encounterType={encounterType}
          data-testid="surveyscreen-k85n"
        />
      )}
      data-testid="form-b7c4"
    />
  );
});

VitalsForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  patient: PropTypes.object.isRequired,
};
