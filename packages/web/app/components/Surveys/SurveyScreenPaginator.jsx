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

export const PatientPortalSurveySubmitButton = styled(FormSubmitButton)`
  width: 100%;
  margin-top: 24px;
  padding: 12px;
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
  const currentComponents = components.filter(
    c => c.visibilityStatus === VISIBILITY_STATUSES.CURRENT,
  );
  const { onStepBack, onStepForward, screenIndex } = usePaginatedForm(currentComponents);

  const maxIndex = currentComponents
    .map(x => x.screenIndex)
    .reduce((max, current) => Math.max(max, current), 0);

  const screenComponents = currentComponents.filter(x => x.screenIndex === screenIndex);

  let surveyScreenProps = {
    values,
    setFieldValue,
    patient,
    allComponents: currentComponents,
    screenComponents,
    onStepForward,
    onStepBack: screenIndex > 0 ? onStepBack : onCancel,
    validateForm,
    setErrors,
    errors,
    status,
    setStatus,
  };
  if (screenIndex === maxIndex) {
    surveyScreenProps = {
      ...surveyScreenProps,
      submitButton: (
        <PatientPortalSurveySubmitButton
          text="Submit"
          color="primary"
          variant="contained"
          onClick={onSurveyComplete}
        />
      ),
    };
  }

  return <SurveyScreen {...surveyScreenProps} />;
};
