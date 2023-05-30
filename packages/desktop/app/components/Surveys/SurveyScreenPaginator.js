import React from 'react';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { usePaginatedForm } from '../Field';
import { SurveyScreen } from './SurveyScreen';
import { Button, OutlinedButton } from '../Button';
import { ButtonRow } from '../ButtonRow';

const COMPLETE_MESSAGE = `
  Press "Complete" to submit your response,
  or use the Back button to review answers.
`;

const Text = styled.div`
  margin-bottom: 10px;
`;

const StyledButtonRow = styled(ButtonRow)`
  margin-top: 24px;
`;

const SurveySummaryScreen = ({ onStepBack, onSurveyComplete }) => (
  <div>
    <Typography variant="h6" gutterBottom>
      Survey complete
    </Typography>
    <Text>{COMPLETE_MESSAGE}</Text>
    <div>
      <StyledButtonRow>
        <OutlinedButton onClick={onStepBack}>Prev</OutlinedButton>
        <Button color="primary" variant="contained" onClick={onSurveyComplete}>
          Complete
        </Button>
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
        components={screenComponents}
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
