import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import { useDispatch } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { MobileSurveyScreen } from '../../components/Surveys/MobileSurveyScreen';
import { submitFormResponse } from '../../store/patientPortal';
import { usePatient } from '../../contexts/Patient';
import { useSurvey } from '../../hooks/useSurvey';
import { FORM_STATUSES } from '../../constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { LoadingIndicator } from '../../components/LoadingIndicator';

export const PatientPortalMobileSurveyResponseForm = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const { patient } = usePatient();
  const { surveyId } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(getCurrentDateTimeString());

  const { survey, loading, error } = useSurvey(surveyId);

  if (loading) {
    return <LoadingIndicator />;
  }

  if (error || !survey) {
    return <div>Error loading form</div>;
  }

  const handleBack = () => {
    history.goBack();
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    setIsSubmitting(true);
    try {
      await dispatch(
        submitFormResponse({
          surveyId,
          patientId: patient?.id,
          startTime,
          endTime: getCurrentDateTimeString(),
          responses: values,
        }),
      );

      // Navigate back to patient portal home after submission
      history.push('/patient-portal');
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
      setIsSubmitting(false);
    }
  };

  // Setup initial values from survey components
  const initialValues = {};
  survey.components.forEach(component => {
    initialValues[component.dataElementId] = '';
  });

  if (isSubmitting) {
    return <LoadingIndicator text="Submitting form..." />;
  }

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      initialStatus={{ submitStatus: FORM_STATUSES.NOT_SUBMITTED }}
    >
      {({
        values,
        errors,
        setFieldValue,
        validateForm,
        setErrors,
        status,
        setStatus,
        isSubmitting,
      }) => (
        <Form style={{ height: '100%' }}>
          <MobileSurveyScreen
            title={survey.name}
            allComponents={survey.components}
            values={values}
            setFieldValue={setFieldValue}
            onStepBack={handleBack}
            onSubmit={handleSubmit}
            patient={patient}
            validateForm={validateForm}
            setErrors={setErrors}
            errors={errors}
            status={status}
            setStatus={setStatus}
            isSubmitting={isSubmitting}
          />
        </Form>
      )}
    </Formik>
  );
};
