import React, { useCallback, useEffect, useRef } from 'react';
import { Typography } from '@material-ui/core';
import styled from 'styled-components';

import { runCalculations } from '@tamanu/shared/utils/calculations';
import { SUBMIT_ATTEMPTED_STATUS } from '@tamanu/constants/forms';

import { OutlinedButton, ButtonRow, Button } from '../Button';
import { SurveyQuestion } from './SurveyQuestion';
import { checkVisibility } from '../../utils/survey';
import { TAMANU_COLORS } from '../../constants/colors';
import { FormGrid } from '../Form/FormGrid';
import { TranslatedText } from '../Translation';

const EmptyStateText = styled(Typography)`
  color: ${({ theme }) => theme.palette.text.secondary};
`;

const StyledButtonRow = styled(ButtonRow)`
  border-top: 1px solid ${TAMANU_COLORS.outline};
  padding-top: 20px;
  margin-block-start: 24px;
`;

const CancelButton = styled(OutlinedButton)`
  margin-right: auto;
`;

/** Recalculates dynamic fields, writing them back into form values. */
const useCalculatedFormValues = (components, values, setFieldValue) => {
  useEffect(() => {
    const calculatedValues = runCalculations(components, values);
    for (const [k, v] of Object.entries(calculatedValues)) {
      // Normalize to `null` so `undefined` and `null` are treated as equivalent answers
      const prev = values[k] ?? null;
      const next = v ?? null;
      if (prev === next) continue;
      setFieldValue(k, v, false);
    }
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
  onCancel,
  showCancelButton = false,
  getComponentForQuestionType,
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
      setStatus({ ...status, submitStatus: SUBMIT_ATTEMPTED_STATUS });

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
        .map((c, index) => (
          <SurveyQuestion
            getComponentForQuestionType={getComponentForQuestionType}
            component={c}
            patient={patient}
            key={c.id}
            inputRef={setQuestionToRef(c.dataElementId)}
            encounterType={encounterType}
            data-testid={`surveyquestion-vmee-${index}`}
          />
        )),
    [encounterType, getComponentForQuestionType, patient, setQuestionToRef, values],
  );

  const visibleComponents = getVisibleComponents(screenComponents, allComponents);

  const emptyStateMessage = (
    <EmptyStateText variant="body2" data-testid="emptystatetext-12ib">
      <TranslatedText
        stringId="general.form.blankPage"
        fallback="This page has been intentionally left blank"
      />
    </EmptyStateText>
  );

  return (
    <FormGrid columns={cols} data-testid="formgrid-h378">
      {visibleComponents.length > 0 ? visibleComponents : emptyStateMessage}
      <StyledButtonRow data-testid="styledbuttonrow-pvdv">
        {submitButton || (
          <>
            {showCancelButton && onCancel && (
              <CancelButton onClick={onCancel}>
                <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
              </CancelButton>
            )}
            <OutlinedButton
              onClick={onStepBack || undefined}
              disabled={!onStepBack}
              data-testid="outlinedbutton-0o9b"
            >
              <TranslatedText stringId="general.action.previous" fallback="Prev" />
            </OutlinedButton>
            <Button
              color="primary"
              variant="contained"
              onClick={validateAndStep}
              data-testid="button-m3a6"
            >
              <TranslatedText stringId="general.action.next" fallback="Next" />
            </Button>
          </>
        )}
      </StyledButtonRow>
    </FormGrid>
  );
};
