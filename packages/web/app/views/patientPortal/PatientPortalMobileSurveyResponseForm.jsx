import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Formik, Form } from 'formik';
import { useDispatch } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import { runCalculations } from '@tamanu/shared/utils/calculations';
import { submitFormResponse } from '../../store/patientPortal';
import { usePatient } from '../../contexts/Patient';
import { useSurvey } from '../../hooks/useSurvey';
import { FORM_STATUSES } from '../../constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { TranslatedText } from '../../components/Translation';
import { usePaginatedForm } from '../../components/Field/PaginatedForm';
import { Typography } from '@material-ui/core';
import { OutlinedButton, Button } from '../../components/Button';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import { checkVisibility } from '../../utils';
import { SurveyQuestion } from '../../components/Surveys/SurveyQuestion';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: white;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  background-color: white;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin-right: 16px;
`;

const Title = styled(Typography)`
  font-size: 18px;
  font-weight: 500;
  flex: 1;
`;

const ContentContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background-color: white;
`;

const ButtonContainer = styled.div`
  padding: 16px;
  border-top: 1px solid #e0e0e0;
  background-color: white;
  display: flex;
  justify-content: space-between;
`;

const StyledButton = styled(Button)`
  min-width: 120px;
  height: 48px;
`;

const StyledOutlinedButton = styled(OutlinedButton)`
  min-width: 120px;
  height: 48px;
`;

// Helper hooks
const useCalculatedFormValues = (components, values, setFieldValue) => {
  useEffect(() => {
    // recalculate dynamic fields
    const calculatedValues = runCalculations(components, values);
    // write values that have changed back into answers
    Object.entries(calculatedValues)
      .filter(([k, v]) => values[k] !== v)
      .map(([k, v]) => setFieldValue(k, v, false));
  }, [components, values, setFieldValue]);
};

const useScrollToFirstError = () => {
  const questionRefs = useRef(null);

  function getQuestionMap() {
    if (!questionRefs.current) {
      // Initialize the Map on first usage.
      questionRefs.current = new Map();
    }
    return questionRefs.current;
  }

  const scrollToQuestion = questionId => {
    const map = getQuestionMap();
    const node = map.get(questionId);
    if (node) {
      node.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  };

  const setQuestionToRef = dataElementId => node => {
    const map = getQuestionMap();
    if (node) {
      map.set(dataElementId, node);
    } else {
      map.delete(dataElementId);
    }
  };

  return { setQuestionToRef, scrollToQuestion };
};

// Survey summary screen shown after all questions are completed
const SurveySummaryScreen = ({ onStepBack, onSubmit, isSubmitting }) => (
  <Container>
    <Header>
      <BackButton onClick={onStepBack} disabled={isSubmitting}>
        <ArrowBackIcon />
      </BackButton>
      <Title>
        <TranslatedText stringId="survey.summary.title" fallback="Review and Submit" />
      </Title>
    </Header>

    <ContentContainer>
      <Typography variant="body1">
        <TranslatedText
          stringId="survey.summary.message"
          fallback="You've completed the form. Click Submit to send your responses, or go back to review your answers."
        />
      </Typography>
    </ContentContainer>

    <ButtonContainer>
      <StyledOutlinedButton onClick={onStepBack} disabled={isSubmitting}>
        <TranslatedText stringId="general.action.back" fallback="Back" />
      </StyledOutlinedButton>

      <StyledButton color="primary" variant="contained" onClick={onSubmit} disabled={isSubmitting}>
        <TranslatedText
          stringId={isSubmitting ? 'general.status.submitting' : 'general.action.submit'}
          fallback={isSubmitting ? 'Submitting...' : 'Submit'}
        />
      </StyledButton>
    </ButtonContainer>
  </Container>
);

// Screen to navigate through survey questions
const SurveyScreen = ({
  title,
  screenComponents,
  allComponents,
  values,
  setFieldValue,
  onStepBack,
  onStepForward,
  validateForm,
  setErrors,
  errors,
  status,
  setStatus,
  patient,
  isSubmitting,
  isLastScreen,
}) => {
  const { setQuestionToRef, scrollToQuestion } = useScrollToFirstError(errors);
  useCalculatedFormValues(allComponents, values, setFieldValue);

  const validateAndContinue = async () => {
    if (isSubmitting) return;

    const formErrors = await validateForm();

    // Only include visible elements
    const pageErrors = Object.keys(formErrors).filter(x =>
      screenComponents
        .filter(c => checkVisibility(c, values, allComponents))
        .map(c => c.dataElementId)
        .includes(x),
    );

    if (pageErrors.length === 0) {
      setErrors({});
      onStepForward();
    } else {
      // Use formik status prop to track if the user has attempted to submit the form
      setStatus({
        ...(status || {}),
        submitStatus: FORM_STATUSES.SUBMIT_ATTEMPTED,
      });

      const firstErroredQuestion = screenComponents.find(({ dataElementId }) =>
        pageErrors.includes(dataElementId),
      );
      if (firstErroredQuestion) {
        scrollToQuestion(firstErroredQuestion.dataElementId);
      }
    }
  };

  const getVisibleComponents = useCallback(
    (components, allComponents) =>
      components
        .filter(c => checkVisibility(c, values, allComponents))
        .map(c => (
          <SurveyQuestion
            component={c}
            patient={patient}
            key={c.id}
            inputRef={setQuestionToRef(c.dataElementId)}
          />
        )),
    [patient, setQuestionToRef, values],
  );

  const visibleComponents = getVisibleComponents(screenComponents, allComponents);

  const emptyStateMessage = (
    <Typography variant="body2" style={{ textAlign: 'center', padding: '20px', color: '#757575' }}>
      <TranslatedText
        stringId="general.form.blankPage"
        fallback="This page has been intentionally left blank"
      />
    </Typography>
  );

  return (
    <Container>
      <Header>
        <BackButton onClick={onStepBack} disabled={isSubmitting}>
          <ArrowBackIcon />
        </BackButton>
        <Title>{title}</Title>
      </Header>

      <ContentContainer>
        {visibleComponents.length > 0 ? visibleComponents : emptyStateMessage}
      </ContentContainer>

      <ButtonContainer>
        <StyledOutlinedButton onClick={onStepBack} disabled={isSubmitting}>
          <TranslatedText stringId="general.action.back" fallback="Back" />
        </StyledOutlinedButton>

        <StyledButton
          color="primary"
          variant="contained"
          onClick={validateAndContinue}
          disabled={isSubmitting}
        >
          <TranslatedText
            stringId={isLastScreen ? 'general.action.review' : 'general.action.next'}
            fallback={isLastScreen ? 'Review' : 'Next'}
          />
        </StyledButton>
      </ButtonContainer>
    </Container>
  );
};

export const PatientPortalMobileSurveyResponseForm = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const { patient } = usePatient();
  const { surveyId } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(getCurrentDateTimeString());
  // Use the paginated form hook outside the Formik render function
  const { onStepBack, onStepForward, screenIndex } = usePaginatedForm();

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

  // Group components by screen index for pagination
  const componentsByScreen = survey.components.reduce((acc, component) => {
    const screenIndex = component.screenIndex || 0;
    if (!acc[screenIndex]) {
      acc[screenIndex] = [];
    }
    acc[screenIndex].push(component);
    return acc;
  }, {});

  const screenIndices = Object.keys(componentsByScreen)
    .map(Number)
    .sort((a, b) => a - b);
  const maxScreenIndex = Math.max(...screenIndices);
  const isLastScreen = screenIndex === maxScreenIndex;
  const isSummaryScreen = screenIndex > maxScreenIndex;

  // For the first screen, back should go to the patient portal
  const handleStepBack = screenIndex === 0 ? handleBack : onStepBack;

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
        // Define submission handler for the final submission
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
                  containerStyle: { marginTop: '20px', padding: '0 20px' },
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
                  containerStyle: { marginTop: '20px', padding: '0 20px' },
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
                containerStyle: { marginTop: '20px', padding: '0 20px' },
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
            {isSummaryScreen ? (
              <SurveySummaryScreen
                onStepBack={onStepBack}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting || formikIsSubmitting}
              />
            ) : (
              <SurveyScreen
                title={survey.name}
                screenComponents={componentsByScreen[screenIndex] || []}
                allComponents={survey.components}
                values={values}
                setFieldValue={setFieldValue}
                onStepBack={handleStepBack}
                onStepForward={onStepForward}
                validateForm={validateForm}
                setErrors={setErrors}
                errors={errors}
                status={status}
                setStatus={setStatus}
                patient={patient}
                isSubmitting={isSubmitting || formikIsSubmitting}
                isLastScreen={isLastScreen}
              />
            )}
          </Form>
        );
      }}
    </Formik>
  );
};
