import React, { useEffect } from 'react';
import { runCalculations } from 'shared/utils/calculations';
import styled from 'styled-components';
import { checkVisibility } from '../../utils';
import { FormGrid } from '../FormGrid';
import { Button, OutlinedButton } from '../Button';
import { SurveyQuestion } from './SurveyQuestion';
import { ButtonRow } from '../ButtonRow';

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
}) => {
  useCalculatedFormValues(components, values, setFieldValue);

  const questionElements = components
    .filter(c => checkVisibility(c, values, components))
    .map(c => <SurveyQuestion component={c} patient={patient} key={c.id} errors={errors} />);

  const validateAndStep = async () => {
    const formErrors = await validateForm();
    const pageErrors = Object.keys(formErrors).filter(x =>
      components.map(c => c.dataElementId).includes(x),
    );
    if (pageErrors.length === 0) {
      setErrors({});
      onStepForward();
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
