import React, { useMemo, useState } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { Divider } from '@material-ui/core';
import { SETTING_KEYS } from '@tamanu/constants';
import { SelectField, Form, FormGrid, ConfirmCancelBackRow } from '@tamanu/ui-components';
import { Field, TranslatedText, BodyText } from '../../../components';
import { useSettings } from '../../../contexts/Settings';
import { useTranslation } from '../../../contexts/Translation';

const StyledDivider = styled(Divider)`
  margin: 36px -32px 20px -32px;
`;

const MAX_FAMILY_SIZE = 12;

const formatDisplayPrice = value => value.toLocaleString('en-US');

// The income bands available to answer the assessment, derived from the sliding fee scale
// setting for the chosen family size. Each band carries the proportion of the fee the
// patient pays, so the discount is the remainder.
export const getAnnualIncomeOptions = (slidingFeeScale, familySize) => {
  const incomeArray = slidingFeeScale[familySize] || [];

  return incomeArray.map((income, index) => {
    let range;
    const incomeDisplay = formatDisplayPrice(income);
    if (index === incomeArray.length - 1) {
      range = `> ${incomeDisplay}`;
    } else {
      const upperValueDisplay = formatDisplayPrice(incomeArray[index + 1]);
      range = `${incomeDisplay} - ${upperValueDisplay}`;
    }
    return { value: range, label: range, percentage: (index + 2) / 10 };
  });
};

export const getAssessmentDiscount = (annualIncomeOptions, annualIncome) => {
  const selectedOption = annualIncomeOptions.find(option => option.value === annualIncome);
  return {
    percentage: (1 - selectedOption.percentage).toFixed(2),
    isManual: false,
  };
};

// The income bands depend on the selected family size, so an income selected against a
// different family size is not a valid answer to this assessment.
export const getAssessmentValidationSchema = (annualIncomeOptions, requiredMessage) =>
  yup.object().shape({
    familySize: yup
      .string()
      .required()
      .translatedLabel(
        <TranslatedText
          stringId="invoice.validation.familySize.path"
          fallback="Family size"
          data-testid="translatedtext-z8qt"
        />,
      ),
    annualIncome: yup
      .string()
      .required()
      .oneOf(
        annualIncomeOptions.map(option => option.value),
        requiredMessage,
      )
      .translatedLabel(
        <TranslatedText
          stringId="invoice.validation.annualIncome.path"
          fallback="Annual income"
          data-testid="translatedtext-qqwm"
        />,
      ),
  });

export const InvoiceDiscountAssessmentForm = ({ onClose, onBack, handleUpdateDiscount }) => {
  const [familySize, setFamilySize] = useState();

  const { getTranslation } = useTranslation();
  const { getSetting } = useSettings();
  const slidingFeeScale = getSetting(SETTING_KEYS.SLIDING_FEE_SCALE);

  const familySizesOptions = Array.from({ length: MAX_FAMILY_SIZE }, (_, i) => ({
    label: (i + 1).toString(),
    value: i,
  }));

  const annualIncomeOptions = useMemo(
    () => getAnnualIncomeOptions(slidingFeeScale, familySize),
    [familySize, slidingFeeScale],
  );

  const validationSchema = useMemo(
    () =>
      getAssessmentValidationSchema(
        annualIncomeOptions,
        getTranslation('validation.required.inline', '*Required'),
      ),
    [annualIncomeOptions, getTranslation],
  );

  const handleSubmit = async values => {
    await handleUpdateDiscount(getAssessmentDiscount(annualIncomeOptions, values.annualIncome));
  };

  return (
    <>
      <BodyText mb="16px" color="textSecondary" data-testid="bodytext-7ki0">
        <TranslatedText
          stringId="invoice.modal.assessment.description"
          fallback="Complete the patient assessment below to add a sliding fee scale discount to the invoice."
          data-testid="translatedtext-c7b6"
        />
      </BodyText>
      <Form
        onSubmit={handleSubmit}
        render={({ submitForm, setFieldValue }) => (
          <>
            <FormGrid columns={1} data-testid="formgrid-i3v1">
              <Field
                name="familySize"
                label={
                  <TranslatedText
                    stringId="invoice.modal.discountAssessment.family.label"
                    fallback="What is the family size?"
                    data-testid="translatedtext-cmoh"
                  />
                }
                component={SelectField}
                options={familySizesOptions}
                onChange={e => {
                  setFamilySize(e.target.value);
                  setFieldValue('annualIncome', '');
                }}
                data-testid="field-23z3"
              />
              <Field
                name="annualIncome"
                label={
                  <TranslatedText
                    stringId="invoice.modal.discountAssessment.income.label"
                    fallback="What is their annual income?"
                    data-testid="translatedtext-kmjd"
                  />
                }
                component={SelectField}
                options={annualIncomeOptions}
                disabled={!familySize && familySize !== 0}
                data-testid="field-rdtx"
              />
            </FormGrid>
            <StyledDivider data-testid="styleddivider-pypl" />
            <ConfirmCancelBackRow
              onConfirm={submitForm}
              onCancel={onClose}
              onBack={onBack}
              data-testid="confirmcancelbackrow-f5b4"
            />
          </>
        )}
        validationSchema={validationSchema}
        data-testid="form-6cak"
      />
    </>
  );
};
