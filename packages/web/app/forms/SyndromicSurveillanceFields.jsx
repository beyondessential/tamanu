import React from 'react';
import styled from 'styled-components';
import { Divider } from '@material-ui/core';
import { useFormikContext, getIn } from 'formik';
import { SUBMIT_ATTEMPTED_STATUS } from '@tamanu/constants/forms';
import { SYNDROMIC_SURVEILLANCE_NO_SYNDROME_ID } from '@tamanu/constants';

import { Colors } from '../constants/styles';
import { CheckField, CheckInput, Field } from '../components/Field';
import { TranslatedReferenceData } from '../components/Translation/TranslatedReferenceData';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useSyndromicSurveillanceSymptomsQuery } from '../api/queries/useSyndromicSurveillanceSymptomsQuery';

export const SYNDROMIC_SURVEILLANCE_INITIAL_VALUES = {
  noSyndrome: false,
  symptomIds: [],
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

export const SyndromicSurveillanceFields = React.memo(({ readOnly, 'data-testid': dataTestId }) => {
  const {
    values,
    errors,
    setFieldValue,
    status: { submitStatus },
  } = useFormikContext();
  const { data: symptoms = [] } = useSyndromicSurveillanceSymptomsQuery();
  const symptomOptions = symptoms.filter(
    symptom => symptom.id !== SYNDROMIC_SURVEILLANCE_NO_SYNDROME_ID,
  );
  const symptomIds = values.symptomIds ?? [];
  const isAnySymptomChecked = symptomIds.length > 0;
  const hasRequiredError =
    submitStatus === SUBMIT_ATTEMPTED_STATUS && !!getIn(errors, 'noSyndrome');

  const toggleSymptom = optionValue => event => {
    const { checked } = event.target;
    setFieldValue(
      'symptomIds',
      checked ? [...symptomIds, optionValue] : symptomIds.filter(id => id !== optionValue),
    );
  };

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
        disabled={readOnly || isAnySymptomChecked}
        data-testid="field-no-syndrome"
      />
      <Divider data-testid="divider-syndromic-surveillance-symptoms" />
      {symptomOptions.map(symptom => (
        <CheckInput
          key={symptom.id}
          name={symptom.id}
          label={
            <TranslatedReferenceData
              fallback={symptom.name}
              value={symptom.id}
              category="syndromicSurveillanceSymptom"
              data-testid={`translatedreferencedata-symptom-${symptom.id}`}
            />
          }
          value={symptomIds.includes(symptom.id)}
          onChange={toggleSymptom(symptom.id)}
          disabled={readOnly || values.noSyndrome}
          data-testid={`field-symptom-${symptom.id}`}
        />
      ))}
    </WhiteBox>
  );
});
