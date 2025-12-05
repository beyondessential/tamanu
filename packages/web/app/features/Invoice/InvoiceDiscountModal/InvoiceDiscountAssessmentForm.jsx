import React, { useMemo, useState } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { Divider } from '@material-ui/core';
import { SETTING_KEYS } from '@tamanu/constants';
import { SelectField, Form, FormGrid, ConfirmCancelBackRow } from '@tamanu/ui-components';
import { TranslatedText } from '../../../components/Translation';
import { BodyText, Heading3 } from '../../../components/Typography';
import { Field } from '../../../components/Field';
import { useSettings } from '../../../contexts/Settings';

const StyledDivider = styled(Divider)`
  margin: 36px -32px 20px -32px;
`;

const MAX_FAMILY_SIZE = 12;

export const InvoiceDiscountAssessmentForm = ({ onClose }) => {
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

  const handleAnnualIncomeChange = e => {
    const selectedOption = annualIncomeOptions.find(option => option.value === e.target.value);
    if (selectedOption) {
      setPercentage(selectedOption.percentage);
    }
  };

  // @ts-ignore todo in SAV-1054
  const handleSubmit = () => {
    // const discount = {
    //   percentage: data.percentage,
    //   reason: data.reason,
    //   isManual: false,
    //   appliedByUser: api?.user,
    //   appliedTime: new Date(),
    // };
  };

  return (
    <>
      <Heading3 mb="8px" data-testid="heading3-luh8">
        <TranslatedText
          stringId="invoice.modal.assessment.subtitle"
          fallback="Patient invoice discount assessment"
          data-testid="translatedtext-ulsm"
        />
      </Heading3>
      <BodyText mb="36px" color="textTertiary" data-testid="bodytext-7ki0">
        <TranslatedText
          stringId="invoice.modal.assessment.description"
          fallback="To begin creating a new invoice, complete the patient discount assessment below."
          data-testid="translatedtext-c7b6"
        />
      </BodyText>
      <Form
        onSubmit={() => handleSubmit({ percentage: (1 - percentage).toFixed(2) })}
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
              data-testid="confirmcancelbackrow-f5b4"
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
        })}
        data-testid="form-6cak"
      />
    </>
  );
};
