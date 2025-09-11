import React, { useMemo } from 'react';
import { VISIBILITY_STATUSES } from '@tamanu/constants';
import {
  checkVisibility,
  Form,
  getFormInitialValues,
  getValidationSchema,
  SurveyScreenPaginator,
  useTranslation,
} from '@tamanu/ui-components';
import { getComponentForQuestionType } from './getComponentForQuestionType';

export const SurveyForm = ({
  survey,
  onSubmit,
  onCancel,
  patient,
  patientAdditionalData,
  currentUser,
  patientProgramRegistration,
  encounterType,
}) => {
  const { getTranslation } = useTranslation();
  const { components } = survey;
  const currentComponents = components.filter(
    c => c.visibilityStatus === VISIBILITY_STATUSES.CURRENT,
  );
  const initialValues = getFormInitialValues(
    currentComponents,
    patient,
    patientAdditionalData,
    currentUser,
    patientProgramRegistration,
  );
  const validationSchema = useMemo(
    () => getValidationSchema(survey, getTranslation),
    [survey, getTranslation],
  );

  return (
    <Form
      initialValues={initialValues}
      onSubmit={onSubmit}
      validationSchema={validationSchema}
      validateOnChange
      validateOnBlur
      data-testid="form-12o2"
      render={({
        submitForm,
        values,
        setFieldValue,
        setValues,
        validateForm,
        setErrors,
        errors,
        setStatus,
        status,
      }) => {
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
            showCancelButton={false}
            getComponentForQuestionType={getComponentForQuestionType}
            encounterType={encounterType}
            data-testid="surveyscreenpaginator-8wns"
          />
        );
      }}
    />
  );
};
