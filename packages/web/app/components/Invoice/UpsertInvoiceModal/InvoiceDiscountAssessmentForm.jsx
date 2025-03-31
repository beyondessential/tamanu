import React, { useMemo, useState } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { Divider } from '@material-ui/core';
import { SETTING_KEYS } from '@tamanu/constants';
import { TranslatedText } from '../../Translation';
import { BodyText, Heading3 } from '../../Typography';
import { ConfirmCancelBackRow } from '../../ButtonRow';
import { Field, Form, SelectField } from '../../Field';
import { FormGrid } from '../../FormGrid';
import { useSettings } from '../../../contexts/Settings';

const StyledDivider = styled(Divider)`
  margin: 36px -32px 20px -32px;
`;

const MAX_FAMILY_SIZE = 12;

export const InvoiceDiscountAssessmentForm = ({
  handleSubmit,
  onClose,
  handleBack,
  isSubmitting,
}) => {
  const [familySize, setFamilySize] = useState();
  const [percentage, setPercentage] = useState();

  const { getSetting } = useSettings();
  const slidingFeeScale = getSetting(SETTING_KEYS.SLIDING_FEE_SCALE);

  const familySizesOptions = Array.from({ length: MAX_FAMILY_SIZE }, (_, i) => ({
    label: (i + 1).toString(),
    value: i,
  }));

  const annualIncomeOptions = useMemo(() => {
    const incomeArray = slidingFeeScale[familySize] || [];

    return incomeArray.map((income, index) => {
      let range;
      if (index === incomeArray.length - 1) {
        range = `> ${income}`;
      } else {
        range = `${income} - ${incomeArray[index + 1]}`;
      }
      return { value: range, label: range, percentage: (index + 2) / 10 };
    });
  }, [familySize, slidingFeeScale]);

  const handleAnnualIncomeChange = (e) => {
    const selectedOption = annualIncomeOptions.find((option) => option.value === e.target.value);
    if (selectedOption) {
      setPercentage(selectedOption.percentage);
    }
  };

  return (
    <>
      <Heading3 mb="8px">
        <TranslatedText
          stringId="invoice.modal.assessment.subtitle"
          fallback="Patient invoice discount assessment"
          data-testid='translatedtext-evqt' />
      </Heading3>
      <BodyText mb="36px" color="textTertiary">
        <TranslatedText
          stringId="invoice.modal.assessment.description"
          fallback="To begin creating a new invoice, complete the patient discount assessment below."
          data-testid='translatedtext-rsl7' />
      </BodyText>
      <Form
        onSubmit={() => handleSubmit({ percentage: (1 - percentage).toFixed(2) })}
        render={({ submitForm }) => (
          <>
            <FormGrid columns={1}>
              <Field
                name="familySize"
                label={
                  <TranslatedText
                    stringId="invoice.modal.discountAssessment.family.label"
                    fallback="What is the family size?"
                    data-testid='translatedtext-3rvw' />
                }
                component={SelectField}
                options={familySizesOptions}
                onChange={(e) => setFamilySize(e.target.value)}
                data-testid='field-7zl5' />
              <Field
                name="annualIncome"
                label={
                  <TranslatedText
                    stringId="invoice.modal.discountAssessment.income.label"
                    fallback="What is their annual income?"
                    data-testid='translatedtext-uwa2' />
                }
                component={SelectField}
                options={annualIncomeOptions}
                disabled={!familySize && familySize !== 0}
                onChange={handleAnnualIncomeChange}
                data-testid='field-dv6y' />
            </FormGrid>
            <StyledDivider />
            <ConfirmCancelBackRow
              onConfirm={submitForm}
              onCancel={onClose}
              onBack={handleBack}
              confirmText={<TranslatedText
                stringId="general.action.next"
                fallback="Next"
                data-testid='translatedtext-v6ga' />}
              confirmDisabled={isSubmitting}
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
                data-testid='translatedtext-l264' />,
            ),
          annualIncome: yup
            .string()
            .required()
            .translatedLabel(
              <TranslatedText
                stringId="invoice.validation.annualIncome.path"
                fallback="Annual income"
                data-testid='translatedtext-bij0' />,
            ),
        })}
      />
    </>
  );
};
