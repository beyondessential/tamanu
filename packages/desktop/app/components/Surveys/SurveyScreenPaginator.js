import React from 'react';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { usePaginatedForm } from '../Field';
import { SurveyScreen } from './SurveyScreen';
import { FormSubmitButton, OutlinedButton } from '../Button';
import { ButtonRow } from '../ButtonRow';
import { TranslatedText } from '../Translation/TranslatedText';

const Text = styled.div`
  margin-bottom: 10px;
`;

const StyledButtonRow = styled(ButtonRow)`
  margin-top: 24px;
`;

const SurveySummaryScreen = ({ onStepBack, onSurveyComplete }) => (
  <div>
    <Typography variant="h6" gutterBottom>
      <TranslatedText stringId="program.modal.surveyResponse.complete" fallback="Survey complete" />
    </Typography>
    <Text>
      <TranslatedText
        stringId="program.modal.surveyResponse.completeMessage"
        fallback='Press "Complete" to submit your response, or use the Back button to review answers.'
      />
    </Text>
    <div>
      <StyledButtonRow>
        <OutlinedButton onClick={onStepBack}>
          <TranslatedText stringId="general.action.prev" fallback="Prev" />
        </OutlinedButton>
        <FormSubmitButton color="primary" variant="contained" onClick={onSurveyComplete}>
          <TranslatedText stringId="general.action.complete" fallback="Complete" />
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
}) => {
  const { components } = survey;
  const { onStepBack, onStepForward, screenIndex } = usePaginatedForm(components);

  const maxIndex = components
    .map(x => x.screenIndex)
    .reduce((max, current) => Math.max(max, current), 0);

  if (screenIndex <= maxIndex) {
    const screenComponents = components.filter(x => x.screenIndex === screenIndex);

    return (
      <SurveyScreen
        values={values}
        setFieldValue={setFieldValue}
        patient={patient}
        allComponents={components}
        screenComponents={screenComponents}
        onStepForward={onStepForward}
        onStepBack={screenIndex > 0 ? onStepBack : onCancel}
        validateForm={validateForm}
        setErrors={setErrors}
        errors={errors}
        status={status}
        setStatus={setStatus}
      />
    );
  }

  return <SurveySummaryScreen onStepBack={onStepBack} onSurveyComplete={onSurveyComplete} />;
};
