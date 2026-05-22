import { Typography } from '@material-ui/core';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { useTranslation } from '../../contexts';
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

const SurveySummaryScreen = ({ onStepBack, onSurveyComplete, completeButtonDisabled }) => {
  const { getTranslation } = useTranslation();
  return (
    <div>
      <Typography variant="h6" gutterBottom data-testid="typography-2fz8">
        <TranslatedText
          stringId="program.modal.surveyResponse.complete"
          fallback="Survey complete"
        />
      </Typography>
      <Text data-testid="text-am03">
        <TranslatedText
          stringId="program.modal.surveyResponse.completeMessage"
          fallback="Press “:complete” to submit your response, or use the “:prev” button to review answers."
          replacements={{
            complete: getTranslation('general.action.complete', 'Complete'),
            prev: getTranslation('general.action.previous', 'Prev'),
          }}
        />
      </Text>
      <div>
        <StyledButtonRow data-testid="styledbuttonrow-ljfc">
          <OutlinedButton onClick={onStepBack} data-testid="outlinedbutton-c5qp">
            <TranslatedText stringId="general.action.previous" fallback="Prev" />
          </OutlinedButton>
          <FormSubmitButton
            color="primary"
            data-testid="formsubmitbutton-pufy"
            disabled={completeButtonDisabled}
            onClick={onSurveyComplete}
            variant="contained"
          >
            <TranslatedText stringId="general.action.complete" fallback="Complete" />
          </FormSubmitButton>
        </StyledButtonRow>
      </div>
    </div>
  );
};

export const SurveyScreenPaginator = ({
  survey: { components },
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
  completeButtonDisabled = false,
  editedDataElementIds = null,
}) => {
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
      completeButtonDisabled={completeButtonDisabled}
      data-testid="surveysummaryscreen-1jn5"
    />
  );
};
