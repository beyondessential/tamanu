import React, { useCallback, useEffect, useRef } from 'react';
import { Typography } from '@material-ui/core';
import { runCalculations } from '@tamanu/shared/utils/calculations';
import styled from 'styled-components';
import { checkVisibility } from '../../utils';
import { FormGrid } from '../FormGrid';
import { Button, OutlinedButton } from '../Button';
import { SurveyQuestion } from './SurveyQuestion';
import { ButtonRow } from '../ButtonRow';
import { Colors, FORM_STATUSES } from '../../constants';
import { TranslatedText } from '../Translation';

const EmptyStateText = styled(Typography)`
  color: ${({ theme }) => theme.palette.text.secondary};
`;

const StyledButtonRow = styled(ButtonRow)`
  border-top: 1px solid ${Colors.outline};
  padding-top: 20px;
  margin-block-start: 24px;
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

export const SurveyScreen = ({
  allComponents,
  screenComponents = allComponents,
  values = {},
  setFieldValue,
  onStepForward,
  onStepBack,
  submitButton,
  patient,
  cols = 1,
  validateForm,
  setErrors,
  errors,
  status,
  setStatus,
  encounterType,
}) => {
  const { setQuestionToRef, scrollToQuestion } = useScrollToFirstError(errors);
  useCalculatedFormValues(allComponents, values, setFieldValue);

  const validateAndStep = async () => {
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
      setStatus({});
    } else {
      // Use formik status prop to track if the user has attempted to submit the form. This is used in
      // Field.js to only show error messages once the user has attempted to submit the form
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
    <FormGrid columns={cols}>
      {visibleComponents.length > 0 ? visibleComponents : emptyStateMessage}
      <StyledButtonRow>
        {submitButton || (
          <>
            <OutlinedButton onClick={onStepBack || undefined} disabled={!onStepBack}>
              <TranslatedText stringId="general.action.previous" fallback="Prev" />
            </OutlinedButton>
            <Button color="primary" variant="contained" onClick={validateAndStep}>
              <TranslatedText stringId="general.action.next" fallback="Next" />
            </Button>
          </>
        )}
      </StyledButtonRow>
    </FormGrid>
  );
};
