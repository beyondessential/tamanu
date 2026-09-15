import React from 'react';
import styled from 'styled-components';
import { Divider } from '@material-ui/core';
import { Form, FormGrid } from '@tamanu/ui-components';
import { FORM_TYPES } from '@tamanu/constants';

import { Colors } from '../constants/styles';
import { CheckField, Field } from '../components/Field';
import { ModalFormActionRow } from '../components/ModalActionRow';
import { TranslatedText } from '../components/Translation/TranslatedText';

// TODO: replace with the real symptom reference data once available
const MOCK_SYMPTOM_OPTIONS = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

const FormContent = styled.div`
  font-size: 14px;
  line-height: 18px;

  .MuiFormControlLabel-label {
    font-size: 14px;
    line-height: 18px;
  }
`;

const WhiteBox = styled.div`
  grid-column: 1 / -1;
  background-color: ${Colors.white};
  border: 1px solid ${Colors.outline};
  border-radius: 4px;
  padding: 20px;
  display: grid;
  gap: 1.2rem;
`;

const IntroText = styled.p`
  margin: 0;
`;

export const SyndromicSurveillanceForm = React.memo(({ onCancel, onSave }) => (
  <Form
    onSubmit={onSave}
    initialValues={{
      noSyndrome: false,
    }}
    formType={FORM_TYPES.CREATE_FORM}
    render={({ submitForm }) => (
      <FormContent data-testid="formcontent-syndromic-surveillance">
        <FormGrid columns={1} data-testid="formgrid-syndromic-surveillance">
          <WhiteBox data-testid="whitebox-syndromic-surveillance">
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
              data-testid="field-no-syndrome"
            />
            <Divider data-testid="divider-syndromic-surveillance-symptoms" />
            {MOCK_SYMPTOM_OPTIONS.map(option => (
              <Field
                key={option.value}
                name={`symptoms.${option.value}`}
                label={option.label}
                component={CheckField}
                data-testid={`field-symptom-${option.value}`}
              />
            ))}
          </WhiteBox>
          <ModalFormActionRow
            onConfirm={submitForm}
            onCancel={onCancel}
            confirmText={
              <TranslatedText
                stringId="general.action.confirm"
                fallback="Confirm"
                data-testid="translatedtext-confirm"
              />
            }
            cancelText={
              <TranslatedText
                stringId="general.action.cancel"
                fallback="Cancel"
                data-testid="translatedtext-cancel"
              />
            }
            data-testid="modalformactionrow-syndromic-surveillance"
          />
        </FormGrid>
      </FormContent>
    )}
    data-testid="form-syndromic-surveillance"
  />
));
