import React from 'react';
import styled from 'styled-components';
import { VISIBILITY_STATUSES } from '@tamanu/constants';
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
      <TranslatedText
        stringId="program.modal.surveyResponse.complete"
        fallback="Survey complete"
        data-test-id='translatedtext-bvlg' />
    </Typography>
    <Text>
      <TranslatedText
        stringId="program.modal.surveyResponse.completeMessage"
        fallback='Press "Complete" to submit your response, or use the Back button to review answers.'
        data-test-id='translatedtext-hewa' />
    </Text>
    <div>
      <StyledButtonRow>
        <OutlinedButton onClick={onStepBack} data-test-id='outlinedbutton-xdaz'>
          <TranslatedText
            stringId="general.action.prev"
            fallback="Prev"
            data-test-id='translatedtext-9trw' />
        </OutlinedButton>
        <FormSubmitButton
          color="primary"
          variant="contained"
          onClick={onSurveyComplete}
          data-test-id='formsubmitbutton-ti8n'>
          <TranslatedText
            stringId="general.action.complete"
            fallback="Complete"
            data-test-id='translatedtext-3qw2' />
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
  const currentComponents = components.filter(
    c => c.visibilityStatus === VISIBILITY_STATUSES.CURRENT,
  );
  const { onStepBack, onStepForward, screenIndex } = usePaginatedForm(currentComponents);

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
