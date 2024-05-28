import React, { useMemo, useState } from 'react';
import * as yup from 'yup';
import { TranslatedText } from '../Translation';
import { BodyText, Heading3 } from '../Typography';
import { ConfirmCancelBackRow } from '../ButtonRow';
import { Field, Form, SelectField } from '../Field';
import { FormGrid } from '../FormGrid';
import styled from 'styled-components';
import { Divider } from '@material-ui/core';

const StyledDivider = styled(Divider)`
  margin: 36px -32px 20px -32px;
`;

const discountTable = {
  1: [5700, 10050, 12600, 14100, 17500],
  2: [6600, 13500, 16300, 19000, 21800],
  3: [7400, 17000, 20500, 23900, 27500],
  4: [8500, 20600, 24800, 28900, 32500],
  5: [9700, 24200, 29000, 33800, 38700],
  6: [10700, 27700, 33200, 37500, 43000],
  7: [11500, 31200, 37400, 43700, 46000],
  8: [12600, 34700, 41600, 48600, 55600],
  9: [14800, 38300, 45900, 53600, 65000],
  10: [16600, 41800, 50200, 58500, 70000],
  11: [18900, 45300, 54400, 63400, 75000],
  12: [23500, 48800, 58600, 68400, 85000]
};

export const InvoiceDiscountAssessmentForm = ({ handleSubmit, onClose, handleBack }) => {
  const familySizesOptions = Array.from({ length: 12 }, (_, i) => ({
    label: (i + 1).toString(),
    value: i + 1,
  }));

  const [familySize, setFamilySize] = useState();
  const [percentageChange, setPercentageChange] = useState();

  const annualIncomeOptions = useMemo(() => {
    const incomeArray = discountTable[familySize] || [];
    let incomeOptions = [];
    let range;
    for (let i = 0; i < incomeArray.length; i++) {
      if (i === 0) {
        range = `0 - ${incomeArray[i]}`;
      } else {
        range = `${incomeArray[i - 1]} - ${incomeArray[i]}`;
      }
      incomeOptions.push({ value: range, label: range, percentageChange: (i + 2) / 10 });
    }
    return incomeOptions;
  }, [familySize]);

  const handleAnnualIncomeChange = (e) => {
    const selectedOption = annualIncomeOptions.find(option => option.value === e.target.value);
    if (selectedOption) {
      setPercentageChange(selectedOption.percentageChange);
    }
  };

  return (
    <>
      <Heading3 mb="8px">
        <TranslatedText
          stringId="invoice.modal.assessment.subtitle"
          fallback="Patient invoice discount assessment"
        />
      </Heading3>
      <BodyText mb="36px" color="textTertiary">
        <TranslatedText
          stringId="invoice.modal.assessment.description"
          fallback="To begin creating a new invoice, complete the patient discount assessment below."
        />
      </BodyText>
      <Form
        onSubmit={() => handleSubmit({ percentageChange: 1 - percentageChange })}
        render={({ submitForm }) => (
          <>
            <FormGrid columns={1}>
              <Field
                name="familySize"
                label={
                  <TranslatedText
                    stringId="invoice.modal.discountAssessment.family.label"
                    fallback="What is the family size?"
                  />
                }
                component={SelectField}
                options={familySizesOptions}
                onChange={e => setFamilySize(e.target.value)}
              />
              <Field
                name="annualIncome"
                label={
                  <TranslatedText
                    stringId="invoice.modal.discountAssessment.income.label"
                    fallback="What is their annual income?"
                  />
                }
                component={SelectField}
                options={annualIncomeOptions}
                disabled={!familySize}
                onChange={handleAnnualIncomeChange}
              />
            </FormGrid>
            <StyledDivider />
            <ConfirmCancelBackRow
              onConfirm={submitForm}
              onCancel={onClose}
              onBack={handleBack}
              confirmText={<TranslatedText stringId="general.action.next" fallback="Next" />}
            />
          </>
        )}
        validationSchema={yup.object().shape({
          familySize: yup
            .string()
            .required()
            .translatedLabel(
              <TranslatedText
                stringId="invoice.validation.familySize.path"
                fallback="Family size"
              />,
            ),
          annualIncome: yup
            .string()
            .required()
            .translatedLabel(
              <TranslatedText
                stringId="invoice.validation.annualIncome.path"
                fallback="Annual income"
              />,
            ),
        })}
      />
    </>
  );
};
