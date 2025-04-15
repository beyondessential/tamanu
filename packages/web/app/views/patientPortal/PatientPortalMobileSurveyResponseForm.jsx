import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import { useDispatch } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MobileSurveyScreen } from '../../components/Surveys/MobileSurveyScreen';
import { submitFormResponse } from '../../store/patientPortal';
import { usePatient } from '../../contexts/Patient';
import { useSurvey } from '../../hooks/useSurvey';
import { FORM_STATUSES } from '../../constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { TranslatedText } from '../../components/Translation';

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
        isSubmitting: formikIsSubmitting,
      }) => {
        // Define handleSubmit inside the Formik render props to have access to Formik helpers
        const handleSubmit = async () => {
          setIsSubmitting(true);
          try {
            const resultAction = await dispatch(
              submitFormResponse({
                surveyId,
                patientId: patient?.id,
                startTime,
                endTime: getCurrentDateTimeString(),
                responses: values,
              }),
            );

            // Check if the action was fulfilled or rejected
            if (resultAction.meta && resultAction.meta.requestStatus === 'fulfilled') {
              // Show success toast
              toast.success(
                <TranslatedText
                  stringId="survey.response.submissionSuccess"
                  fallback="Form submitted successfully"
                />,
                {
                  position: toast.POSITION.TOP_CENTER,
                  style: { marginTop: '80px', marginLeft: '20px', marginRight: '20px' },
                },
              );
              // Navigate back to patient portal home after successful submission
              history.push('/patient-portal');
            } else {
              // Extract error message from the rejected action
              const errorMessage =
                resultAction.payload?.message ||
                resultAction.error?.message ||
                'Form submission failed';
              console.error('Error submitting form:', errorMessage, resultAction);

              // Show error toast
              toast.error(
                <TranslatedText
                  stringId="survey.response.submissionError"
                  fallback={errorMessage}
                />,
                {
                  position: toast.POSITION.TOP_CENTER,
                  style: { marginTop: '80px', marginLeft: '20px', marginRight: '20px' },
                },
              );

              // If there's validation errors in the payload, display them
              if (resultAction.payload?.validationErrors) {
                // Set Formik errors from the validation errors
                setErrors(resultAction.payload.validationErrors);
                setStatus({
                  ...status,
                  submitStatus: FORM_STATUSES.SUBMIT_ATTEMPTED,
                });
              } else {
                // Set error status
                setStatus({
                  ...status,
                  submitStatus: FORM_STATUSES.SUBMIT_ATTEMPTED,
                });
              }
            }
          } catch (error) {
            console.error('Error submitting form:', error);
            // Handle any unexpected errors with toast
            toast.error(
              <TranslatedText
                stringId="survey.response.unexpectedError"
                fallback="Unexpected error during form submission"
              />,
              {
                position: toast.POSITION.TOP_CENTER,
                style: { marginLeft: '20px', marginRight: '20px' },
              },
            );
            // Handle any unexpected errors
            setStatus({
              ...status,
              submitStatus: FORM_STATUSES.SUBMIT_ATTEMPTED,
            });
          } finally {
            setIsSubmitting(false);
          }
        };

        return (
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
              isSubmitting={isSubmitting || formikIsSubmitting}
            />
          </Form>
        );
      }}
    </Formik>
  );
};
