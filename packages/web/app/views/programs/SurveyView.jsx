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
  useDateTimeFormat,
} from '@tamanu/ui-components';
import { ProgramsPane, ProgramsPaneHeader, ProgramsPaneHeading } from './ProgramsPane';
import { getComponentForQuestionType } from '../../components/Surveys';
import { useTranslation } from '../../contexts/Translation';
import { useEncounter } from '../../contexts/Encounter';
import { Colors } from '../../constants';

export const SurveyPaneHeader = styled(ProgramsPaneHeader)`
  background: ${props => props.theme.palette.primary.main};
  text-align: center;
  border-top-right-radius: 3px;
  border-top-left-radius: 3px;
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
}) => {
  const { getTranslation } = useTranslation();
  const { getCurrentDateTime } = useDateTimeFormat();
  const { encounter } = useEncounter();
  const { components } = survey;
  const currentComponents = components.filter(
    c => c.visibilityStatus === VISIBILITY_STATUSES.CURRENT,
  );
  const initialValues = getFormInitialValues({
    components: currentComponents,
    additionalData: patientAdditionalData,
    patient,
    currentUser,
    patientProgramRegistration,
    getCurrentDateTime,
  });
  const validationSchema = useMemo(() => getValidationSchema(survey, getTranslation), [
    survey,
    getTranslation,
  ]);

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
      <SurveyViewForm {...props} />
    </ProgramsPane>
  );
};
