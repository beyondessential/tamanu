import React, { useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { VISIBILITY_STATUSES } from '@tamanu/constants';

import { Typography } from '@material-ui/core';

import { ButtonRow, FormSubmitButton, OutlinedButton } from '../Button';
import { TranslatedText } from '../Translation/TranslatedText';
import { SurveyScreen } from './SurveyScreen';
import { usePaginatedForm } from './usePaginatedForm';

const Text = styled.p`
  margin-block: 0 10px;
`;

const StyledButtonRow = styled(ButtonRow)`
  margin-block-start: 24px;
`;

const SurveySummaryScreen = ({ onStepBack, onSurveyComplete, summarySubmitButton, completeButtonDisabled }) => (
  <div>
    <Typography variant="h6" gutterBottom data-testid="typography-2fz8">
      <TranslatedText
        stringId="program.modal.surveyResponse.complete"
        fallback="Survey complete"
        data-testid="translatedtext-97rx"
      />
    </Typography>
    <Text data-testid="text-am03">
      <TranslatedText
        stringId="program.modal.surveyResponse.completeMessage"
        fallback='Press "Complete" to submit your response, or use the Back button to review answers.'
        data-testid="translatedtext-268y"
      />
    </Text>
    <div>
      <StyledButtonRow data-testid="styledbuttonrow-ljfc">
        <OutlinedButton onClick={onStepBack} data-testid="outlinedbutton-c5qp">
          <TranslatedText
            stringId="general.action.prev"
            fallback="Prev"
            data-testid="translatedtext-lzgi"
          />
        </OutlinedButton>
        {summarySubmitButton || (
          <FormSubmitButton
          color="primary"
          data-testid="formsubmitbutton-pufy"
          disabled={completeButtonDisabled}
          onClick={onSurveyComplete}
          variant="contained"
        >
            <TranslatedText
              stringId="general.action.complete"
              fallback="Complete"
              data-testid="translatedtext-7box"
            />
          </FormSubmitButton>
        )}
      </StyledButtonRow>
    </div>
  </div>
);

export const SurveyScreenPaginator = ({
  survey,
  values,
  onSurveyComplete,
  onCancel,
  setFieldValue,
  patient,
  validateForm,
  setErrors,
  errors,
  status,
  setStatus,
  showCancelButton,
  encounterType,
  getComponentForQuestionType,
  summarySubmitButton = null,
  onScreenIndexChange = undefined,
  completeButtonDisabled = false,
  editedDataElementIds = null,
}) => {
  const { components } = survey;

  const { onStepBack, onStepForward, screenIndex } = usePaginatedForm();

  const currentComponents = useMemo(
    () => components.filter(c => c.visibilityStatus === VISIBILITY_STATUSES.CURRENT),
    [components],
  );
  const screenComponents = useMemo(
    () => currentComponents.filter(x => x.screenIndex === screenIndex),
    [currentComponents, screenIndex],
  );

  const maxIndex = currentComponents.reduce(
    (max, current) => Math.max(max, current.screenIndex),
    0,
  );

  useEffect(() => {
    onScreenIndexChange?.(Math.min(screenIndex, maxIndex));
  }, [maxIndex, onScreenIndexChange, screenIndex]);

  if (screenIndex <= maxIndex) {
    return (
      <SurveyScreen
        values={values}
        setFieldValue={setFieldValue}
        patient={patient}
        allComponents={currentComponents}
        screenComponents={screenComponents}
        onStepForward={onStepForward}
        onStepBack={screenIndex > 0 ? onStepBack : onCancel}
        onCancel={onCancel}
        validateForm={validateForm}
        setErrors={setErrors}
        errors={errors}
        status={status}
        setStatus={setStatus}
        showCancelButton={showCancelButton}
        encounterType={encounterType}
        getComponentForQuestionType={getComponentForQuestionType}
        editedDataElementIds={editedDataElementIds}
        data-testid="surveyscreen-2tj0"
      />
    );
  }

  return (
    <SurveySummaryScreen
      onStepBack={onStepBack}
      onSurveyComplete={onSurveyComplete}
      summarySubmitButton={summarySubmitButton}
      completeButtonDisabled={completeButtonDisabled}
      data-testid="surveysummaryscreen-1jn5"
    />
  );
};
