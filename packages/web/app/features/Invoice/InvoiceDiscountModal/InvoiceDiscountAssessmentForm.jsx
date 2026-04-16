import React, { useMemo, useState } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { Divider } from '@material-ui/core';
import { SETTING_KEYS } from '@tamanu/constants';
import { SelectField, Form, FormGrid, ConfirmCancelBackRow } from '@tamanu/ui-components';
import { Field, TranslatedText, BodyText } from '../../../components';
import { useSettings } from '../../../contexts/Settings';

const StyledDivider = styled(Divider)`
  margin: 36px -32px 20px -32px;
`;

const MAX_FAMILY_SIZE = 12;

const formatDisplayPrice = value => value.toLocaleString('en-US');

const validationSchema = yup.object().shape({
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
      const incomeDisplay = formatDisplayPrice(income);
      if (index === incomeArray.length - 1) {
        range = `> ${incomeDisplay}`;
      } else {
        const upperValueDisplay = formatDisplayPrice(incomeArray[index + 1]);
        range = `${incomeDisplay} - ${upperValueDisplay}`;
      }
      return { value: range, label: range, percentage: (index + 2) / 10 };
    });
  }, [familySize, slidingFeeScale]);

  const handleAnnualIncomeChange = e => {
    const selectedOption = annualIncomeOptions.find(option => option.value === e.target.value);
    if (selectedOption) {
      setPercentage(selectedOption.percentage);
    }
  };

  const handleSubmit = async () => {
    const discount = {
      percentage: (1 - percentage).toFixed(2),
      isManual: false,
    };
    await handleUpdateDiscount(discount);
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
        render={({ submitForm }) => (
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
                onChange={e => setFamilySize(e.target.value)}
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
                onChange={handleAnnualIncomeChange}
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
