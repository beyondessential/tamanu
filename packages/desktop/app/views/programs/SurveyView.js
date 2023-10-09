import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Form } from 'desktop/app/components/Field';
import { checkVisibility, getFormInitialValues, getValidationSchema } from 'desktop/app/utils';
import { ProgramsPane, ProgramsPaneHeader, ProgramsPaneHeading } from './ProgramsPane';
import { Colors } from '../../constants';
import { SurveyScreenPaginator } from '../../components/Surveys';
import { useEncounter } from '../../contexts/Encounter';

export const SurveyPaneHeader = styled(ProgramsPaneHeader)`
  background: ${props => props.theme.palette.primary.main};
  text-align: center;
  border-top-right-radius: 3px;
  border-top-left-radius: 3px;
`;

export const SurveyPaneHeading = styled(ProgramsPaneHeading)`
  color: ${Colors.white};
`;

export const SurveyView = ({
  survey,
  onSubmit,
  onCancel,
  patient,
  patientAdditionalData,
  currentUser,
}) => {
  const { encounter } = useEncounter();
  const { components } = survey;
  const initialValues = getFormInitialValues(
    components,
    patient,
    patientAdditionalData,
    currentUser,
  );
  const validationSchema = useMemo(
    () => getValidationSchema(survey, { encounterType: encounter.type }),
    [survey, encounter?.type],
  );

  const onSubmitSurvey = data => {
    onSubmit(data);
  };

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
    } = props;

    // 1. get a list of visible fields
    const submitVisibleValues = event => {
      const visibleFields = new Set(
        components
          .filter(c => checkVisibility(c, { ...values, encounterType: encounter.type }, components))
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
      />
    );
  };

  return (
    <ProgramsPane>
      <SurveyPaneHeader>
        <SurveyPaneHeading variant="h6">{survey.name}</SurveyPaneHeading>
      </SurveyPaneHeader>
      <Form
        initialValues={initialValues}
        onSubmit={onSubmitSurvey}
        render={renderSurvey}
        validationSchema={validationSchema}
        validateOnChange
        validateOnBlur
      />
    </ProgramsPane>
  );
};
