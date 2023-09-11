import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Form } from 'desktop/app/components/Field';
import { shouldSaveComponent, getFormInitialValues, getValidationSchema } from 'desktop/app/utils';
import { ProgramsPane, ProgramsPaneHeader, ProgramsPaneHeading } from './ProgramsPane';
import { Colors } from '../../constants';
import { SurveyScreenPaginator } from '../../components/Surveys';

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
  const { components } = survey;
  const initialValues = getFormInitialValues(
    components,
    patient,
    patientAdditionalData,
    currentUser,
  );
  const validationSchema = useMemo(() => getValidationSchema(survey), [survey]);

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

    const submitSaveableValues = event => {
      // 1. get a list of saveable fields (visible and with config.shouldPersist !== false)
      const saveableFields = new Set(
        components.filter(c =>
          shouldSaveComponent(c, values, components).map(x => x.dataElementId),
        ),
      );

      // 2. Filter the form values to only include saveable fields
      const saveableValues = Object.fromEntries(
        Object.entries(values).filter(([key]) => saveableFields.has(key)),
      );

      // 3. Set saveable values in form state
      setValues(saveableValues);
      // The third parameter makes sure only saveableFields are validated against
      submitForm(event, null, saveableFields);
    };

    return (
      <SurveyScreenPaginator
        survey={survey}
        patient={patient}
        values={values}
        setFieldValue={setFieldValue}
        onSurveyComplete={submitSaveableValues}
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
