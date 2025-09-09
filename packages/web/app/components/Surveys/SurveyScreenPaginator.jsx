import React from 'react';
import styled from 'styled-components';
import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { FormSubmitButton, OutlinedButton, ButtonRow } from '@tamanu/ui-components';
import { Typography } from '@material-ui/core';
import { usePaginatedForm } from '../Field';
import { SurveyScreen } from './SurveyScreen';
import { TranslatedText } from '../Translation/TranslatedText';
import { useEncounter } from '../../contexts/Encounter';

const Text = styled.div`
  margin-bottom: 10px;
`;

const StyledButtonRow = styled(ButtonRow)`
  margin-top: 24px;
`;

const SurveySummaryScreen = ({ onStepBack, onSurveyComplete }) => (
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
        <FormSubmitButton
          color="primary"
          variant="contained"
          onClick={onSurveyComplete}
          data-testid="formsubmitbutton-pufy"
        >
          <TranslatedText
            stringId="general.action.complete"
            fallback="Complete"
            data-testid="translatedtext-7box"
          />
        </FormSubmitButton>
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
}) => {
  const { components } = survey;
  const currentComponents = components.filter(
    c => c.visibilityStatus === VISIBILITY_STATUSES.CURRENT,
  );
  const { onStepBack, onStepForward, screenIndex } = usePaginatedForm(currentComponents);
  const { encounter } = useEncounter();

  const maxIndex = currentComponents
    .map(x => x.screenIndex)
    .reduce((max, current) => Math.max(max, current), 0);

  if (screenIndex <= maxIndex) {
    const screenComponents = currentComponents.filter(x => x.screenIndex === screenIndex);

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
        encounterType={encounter?.encounterType}
        data-testid="surveyscreen-2tj0"
      />
    );
  }

  return (
    <SurveySummaryScreen
      onStepBack={onStepBack}
      onSurveyComplete={onSurveyComplete}
      data-testid="surveysummaryscreen-1jn5"
    />
  );
};
