import React, { useCallback, useEffect, useRef } from 'react';
import { Typography } from '@material-ui/core';
import { runCalculations } from '@tamanu/shared/utils/calculations';
import styled from 'styled-components';
import { checkVisibility } from '../../utils';
import { Button } from '../Button';
import { SurveyQuestion } from './SurveyQuestion';
import { Colors, FORM_STATUSES } from '../../constants';
import { TranslatedText } from '../Translation';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: ${Colors.background};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid ${Colors.outline};
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

const SubmitButtonContainer = styled.div`
  padding: 16px;
  border-top: 1px solid ${Colors.outline};
  background-color: white;
`;

const StyledSubmitButton = styled(Button)`
  width: 100%;
  height: 48px;
`;

const EmptyStateText = styled(Typography)`
  color: ${({ theme }) => theme.palette.text.secondary};
  text-align: center;
  padding: 20px;
`;

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
    node.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
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

export const MobileSurveyScreen = ({
  allComponents,
  screenComponents = allComponents,
  values = {},
  setFieldValue,
  onStepBack,
  onSubmit,
  patient,
  validateForm,
  setErrors,
  errors,
  status,
  setStatus,
  encounterType,
  title = 'Complete form',
}) => {
  const { setQuestionToRef, scrollToQuestion } = useScrollToFirstError(errors);
  useCalculatedFormValues(allComponents, values, setFieldValue);

  const validateAndSubmit = async () => {
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
      onSubmit();
      setStatus({});
    } else {
      // Use formik status prop to track if the user has attempted to submit the form
      setStatus({ ...status, submitStatus: FORM_STATUSES.SUBMIT_ATTEMPTED });

      const firstErroredQuestion = screenComponents.find(({ dataElementId }) =>
        pageErrors.includes(dataElementId),
      );
      scrollToQuestion(firstErroredQuestion.dataElementId);
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
            encounterType={encounterType}
          />
        )),
    [encounterType, patient, setQuestionToRef, values],
  );

  const visibleComponents = getVisibleComponents(screenComponents, allComponents);

  const emptyStateMessage = (
    <EmptyStateText variant="body2">
      <TranslatedText
        stringId="general.form.blankPage"
        fallback="This page has been intentionally left blank"
      />
    </EmptyStateText>
  );

  return (
    <Container>
      <Header>
        {onStepBack && (
          <BackButton onClick={onStepBack}>
            <ArrowBackIcon />
          </BackButton>
        )}
        <Title>{title}</Title>
      </Header>

      <ContentContainer>
        {visibleComponents.length > 0 ? visibleComponents : emptyStateMessage}
      </ContentContainer>

      <SubmitButtonContainer>
        <StyledSubmitButton color="primary" variant="contained" onClick={validateAndSubmit}>
          <TranslatedText stringId="general.action.submit" fallback="Submit" />
        </StyledSubmitButton>
      </SubmitButtonContainer>
    </Container>
  );
};
