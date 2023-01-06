import React from 'react';
import styled from 'styled-components';
import { checkVisibility } from '../../utils';
import { FormGrid } from '../FormGrid';
import { Button, OutlinedButton } from '../Button';
import { SurveyQuestion } from './SurveyQuestion';
import { ButtonRow } from '../ButtonRow';

const StyledButtonRow = styled(ButtonRow)`
  margin-top: 24px;
`;

export const SurveyScreen = ({
  components,
  values = {},
  onStepForward,
  onStepBack,
  submitButton,
  patient,
  cols = 1,
  validateForm,
  setErrors,
}) => {
  const questionElements = components
    .filter(c => checkVisibility(c, values, components))
    .map(c => <SurveyQuestion component={c} patient={patient} key={c.id} />);

  const validateAndStep = async () => {
    const formErrors = await validateForm();
    const pageErrors = Object.keys(formErrors).filter(x =>
      components.map(c => c.dataElementId).includes(x),
    );
    if (pageErrors.length === 0) {
      setErrors({});
      onStepForward();
    } else {
      // Errors should already be in page order, fetch the DOM element and scroll to it
      const element = document.querySelector(`[name='${pageErrors[0]}']`);
      if (!element) return;

      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
