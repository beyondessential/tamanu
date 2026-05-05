import React, { useMemo, useEffect } from 'react';
import styled from 'styled-components';
import { VISIBILITY_STATUSES } from '@tamanu/constants';
import {
  checkVisibility,
  Form,
  getFormInitialValues,
  getValidationSchema,
  SurveyScreenPaginator,
  TranslatedReferenceData,
  useDateTime,
} from '@tamanu/ui-components';
import { ProgramsPane, ProgramsPaneHeader, ProgramsPaneHeading } from './ProgramsPane';
import { getComponentForQuestionType } from '../../components/Surveys';
import { useTranslation } from '../../contexts/Translation';
import { useEncounter } from '../../contexts/Encounter';
import { Colors } from '../../constants';

export const SurveyPaneHeader = styled(ProgramsPaneHeader)`
  background-color: ${props => props.theme.palette.primary.main};
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
  text-align: center;
`;

export const SurveyPaneHeading = styled(ProgramsPaneHeading)`
  color: ${Colors.white};
`;

const DirtyStateTracker = ({ dirty, setDirty }) => {
  useEffect(() => {
    if (setDirty) {
      setDirty(dirty);
    }
  }, [dirty, setDirty]);

  return null;
};

export const SurveyViewForm = ({
  survey,
  onSubmit,
  onCancel,
  patient,
  patientAdditionalData,
  currentUser,
  patientProgramRegistration,
  showCancelButton,
  setSurveyFormDirty,
  initialAnswerOverrides = null,
  disableCompleteUntilDirty = false,
}) => {
  const { getTranslation } = useTranslation();
  const { getCurrentDateTime } = useDateTime();
  const { encounter } = useEncounter();
  const { components } = survey;
  const currentComponents = components.filter(
    c => c.visibilityStatus === VISIBILITY_STATUSES.CURRENT,
  );
  const initialValues = useMemo(() => {
    const base = getFormInitialValues({
      components: currentComponents,
      additionalData: patientAdditionalData,
      patient,
      currentUser,
      patientProgramRegistration,
      getCurrentDateTime,
    });
    if (!initialAnswerOverrides) {
      return base;
    }
    return { ...base, ...initialAnswerOverrides };
  }, [
    currentComponents,
    patientAdditionalData,
    patient,
    currentUser,
    patientProgramRegistration,
    getCurrentDateTime,
    initialAnswerOverrides,
  ]);
  const validationSchema = useMemo(
    () => getValidationSchema(survey, getTranslation),
    [survey, getTranslation],
  );

  const renderSurvey = props => {
    const {
      submitForm,
      values,
      setFieldValue,
      setValues,
      validateForm,
      setErrors,
      errors,
      setStatus,
      status,
      dirty,
    } = props;

    // 1. get a list of visible fields
    const submitVisibleValues = event => {
      const visibleFields = new Set(
        currentComponents
          .filter(c => checkVisibility(c, values, currentComponents))
          .map(x => x.dataElementId),
      );

      // 2. Filter the form values to only include visible fields
      const visibleValues = Object.fromEntries(
        Object.entries(values).filter(([key]) => visibleFields.has(key)),
      );

      // 3. Set visible values in form state
      setValues(visibleValues);
      // The third parameter makes sure only visibleFields are validated against
      submitForm(event, null, visibleFields);
    };

    return (
      <>
        <DirtyStateTracker dirty={dirty} setDirty={setSurveyFormDirty} />
        <SurveyScreenPaginator
          survey={survey}
          patient={patient}
          values={values}
          setFieldValue={setFieldValue}
          onSurveyComplete={submitVisibleValues}
          onCancel={onCancel}
          validateForm={validateForm}
          setErrors={setErrors}
          errors={errors}
          setStatus={setStatus}
          status={status}
          showCancelButton={showCancelButton}
          getComponentForQuestionType={getComponentForQuestionType}
          encounterType={encounter?.type}
          completeButtonDisabled={disableCompleteUntilDirty && !dirty}
          data-testid="surveyscreenpaginator-8wns"
        />
      </>
    );
  };

  return (
    <Form
      initialValues={initialValues}
      onSubmit={onSubmit}
      render={renderSurvey}
      validationSchema={validationSchema}
      validateOnChange
      validateOnBlur
      enableReinitialize={Boolean(initialAnswerOverrides) || disableCompleteUntilDirty}
      data-testid="form-12o2"
    />
  );
};

export const SurveyView = props => {
  const { survey } = props;
  return (
    <ProgramsPane data-testid="programspane-s83l">
      <SurveyPaneHeader data-testid="surveypaneheader-q0w3">
        <SurveyPaneHeading variant="h6" data-testid="surveypaneheading-b5sc">
          <TranslatedReferenceData category="survey" value={survey.id} fallback={survey.name} />
        </SurveyPaneHeading>
      </SurveyPaneHeader>
      <SurveyViewForm
        survey={survey}
        onSubmit={props.onSubmit}
        onCancel={props.onCancel}
        patient={props.patient}
        patientAdditionalData={props.patientAdditionalData}
        currentUser={props.currentUser}
        patientProgramRegistration={props.patientProgramRegistration}
        showCancelButton={props.showCancelButton}
        setSurveyFormDirty={props.setSurveyFormDirty}
        initialAnswerOverrides={props.initialAnswerOverrides}
        disableCompleteUntilDirty={props.disableCompleteUntilDirty}
      />
    </ProgramsPane>
  );
};
