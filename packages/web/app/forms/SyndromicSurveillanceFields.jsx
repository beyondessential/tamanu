import React from 'react';
import styled from 'styled-components';
import { Divider } from '@material-ui/core';
import { useFormikContext, getIn } from 'formik';
import { SUBMIT_ATTEMPTED_STATUS } from '@tamanu/constants/forms';

import { Colors } from '../constants/styles';
import { CheckField, Field } from '../components/Field';
import { TranslatedText } from '../components/Translation/TranslatedText';

// TODO: replace with the real symptom reference data once available
export const MOCK_SYMPTOM_OPTIONS = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

export const INITIAL_SYMPTOMS = MOCK_SYMPTOM_OPTIONS.reduce(
  (values, option) => ({ ...values, [option.value]: false }),
  {},
);

export const SYNDROMIC_SURVEILLANCE_INITIAL_VALUES = {
  noSyndrome: false,
  symptoms: INITIAL_SYMPTOMS,
};

const WhiteBox = styled.div`
  grid-column: 1 / -1;
  background-color: ${Colors.white};
  border: 1px solid ${props => (props.$error ? Colors.alert : Colors.outline)};
  border-radius: 4px;
  padding: 20px;
  display: grid;
  gap: 1.2rem;
  font-size: 14px;
  line-height: 18px;

  .MuiFormControlLabel-label {
    font-size: 14px;
    line-height: 18px;
  }
`;

const IntroText = styled.p`
  margin: 0;
`;

export const SyndromicSurveillanceFields = React.memo(({ 'data-testid': dataTestId }) => {
  const {
    values,
    errors,
    status: { submitStatus },
  } = useFormikContext();
  const isAnySymptomChecked = Object.values(values.symptoms ?? {}).some(Boolean);
  const hasRequiredError =
    submitStatus === SUBMIT_ATTEMPTED_STATUS && !!getIn(errors, 'noSyndrome');

  return (
    <WhiteBox $error={hasRequiredError} data-testid={dataTestId}>
      <IntroText data-testid="introtext-syndromic-surveillance">
        <TranslatedText
          stringId="syndromicSurveillance.modal.intro"
          fallback="Select all patient symptoms that apply for syndromic surveillance"
          data-testid="translatedtext-syndromic-surveillance-intro"
        />
      </IntroText>
      <Divider data-testid="divider-syndromic-surveillance-intro" />
      <Field
        name="noSyndrome"
        label={
          <TranslatedText
            stringId="syndromicSurveillance.modal.noSyndrome.label"
            fallback="No syndrome (Patient was asked and none apply)"
            data-testid="translatedtext-no-syndrome"
          />
        }
        component={CheckField}
        disabled={isAnySymptomChecked}
        data-testid="field-no-syndrome"
      />
      <Divider data-testid="divider-syndromic-surveillance-symptoms" />
      {MOCK_SYMPTOM_OPTIONS.map(option => (
        <Field
          key={option.value}
          name={`symptoms.${option.value}`}
          label={option.label}
          component={CheckField}
          disabled={values.noSyndrome}
          data-testid={`field-symptom-${option.value}`}
        />
      ))}
    </WhiteBox>
  );
});
