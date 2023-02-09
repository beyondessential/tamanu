import React, { useEffect, useRef } from 'react';
import { runCalculations } from 'shared/utils/calculations';
import styled from 'styled-components';
import { checkVisibility } from '../../utils';
import { FormGrid } from '../FormGrid';
import { Button, OutlinedButton } from '../Button';
import { SurveyQuestion } from './SurveyQuestion';
import { ButtonRow } from '../ButtonRow';
import { FORM_STATUSES } from '../../constants';

const StyledButtonRow = styled(ButtonRow)`
  margin-top: 24px;
`;

const useCalculatedFormValues = (components, values, setFieldValue) => {
  useEffect(() => {
    // recalculate dynamic fields
    const calculatedValues = runCalculations(components, values);
    // write values that have changed back into answers
    Object.entries(calculatedValues)
      .filter(([k, v]) => values[k] !== v)
      .map(([k, v]) => setFieldValue(k, v));
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
  components,
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
  setStatus,
}) => {
  const { setQuestionToRef, scrollToQuestion } = useScrollToFirstError(errors);
  useCalculatedFormValues(components, values, setFieldValue);

  const questionElements = components
    .filter(c => checkVisibility(c, values, components))
    .map(c => (
      <SurveyQuestion
        component={c}
        patient={patient}
        key={c.id}
        inputRef={setQuestionToRef(c.dataElementId)}
      />
    ));

  const validateAndStep = async () => {
    const formErrors = await validateForm();
    const pageErrors = Object.keys(formErrors).filter(x =>
      components.map(c => c.dataElementId).includes(x),
    );
    // Use formik status prop to track if the user has attempted to submit the form. This is used in
    // Field.js to only show error messages once the user has attempted to submit the form
    setStatus(FORM_STATUSES.SUBMIT_ATTEMPTED);

    if (pageErrors.length === 0) {
      setErrors({});
      onStepForward();
    } else {
      const firstErroredQuestion = components.find(({ dataElementId }) =>
        pageErrors.includes(dataElementId),
      );
      scrollToQuestion(firstErroredQuestion.dataElementId);
    }
  };

  return (
    <FormGrid columns={cols}>
      {questionElements}
      <StyledButtonRow>
        {submitButton || (
          <>
            <OutlinedButton onClick={onStepBack || undefined} disabled={!onStepBack}>
              Prev
            </OutlinedButton>
            <Button color="primary" variant="contained" onClick={validateAndStep}>
              Next
            </Button>
          </>
        )}
      </StyledButtonRow>
    </FormGrid>
  );
};
