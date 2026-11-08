import React, { useMemo } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { Divider } from '@material-ui/core';
import { SETTING_KEYS } from '@tamanu/constants';
import { SelectField, Form, FormGrid, ConfirmCancelBackRow } from '@tamanu/ui-components';
import { Field, TranslatedText, BodyText } from '../../../components';
import { useSettings } from '../../../contexts/Settings';
import { useTranslation } from '../../../contexts/Translation';
import { usePatientAdditionalDataQuery } from '../../../api/queries';
import { getAnnualIncomeOptions, getFamilySizeOptions } from '../../../utils/slidingFeeScale';

const StyledDivider = styled(Divider)`
  margin: 36px -32px 20px -32px;
`;

export { getAnnualIncomeOptions };

export const getAssessmentDiscount = (annualIncomeOptions, annualIncome) => {
  const selectedOption = annualIncomeOptions.find(option => option.value === annualIncome);
  return {
    percentage: (1 - selectedOption.percentage).toFixed(2),
    isManual: false,
  };
};

// The income bands depend on the selected family size, so an income selected against a
// different family size is not a valid answer to this assessment.
export const getAssessmentValidationSchema = (slidingFeeScale, requiredMessage) =>
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
      .when('familySize', (familySize, schema) =>
        schema.oneOf(
          getAnnualIncomeOptions(slidingFeeScale, familySize).map(option => option.value),
          requiredMessage,
        ),
      )
      .translatedLabel(
        <TranslatedText
          stringId="invoice.validation.annualIncome.path"
          fallback="Annual income"
          data-testid="translatedtext-qqwm"
        />,
      ),
  });

/**
 * The assessment opens on what the patient's billing details already say, so the common case is
 * confirming rather than re-answering.
 *
 * Both answers belong to the scale as it stood when they were saved. A deployment can edit the
 * scale since, so an answer it no longer offers is dropped rather than shown as chosen: a family
 * size the scale no longer covers would come with no income bands to pick from, and an income
 * band it no longer lists is not something this assessment can price.
 */
export const getAssessmentInitialValues = (slidingFeeScale, additionalData) => {
  const familySize = additionalData?.familySize ?? '';
  if (!familySize) return {};

  const annualIncomeOptions = getAnnualIncomeOptions(slidingFeeScale, familySize);
  if (!annualIncomeOptions.length) return {};

  const savedAnnualIncome = additionalData?.annualIncome;
  const isSavedIncomeStillOffered = annualIncomeOptions.some(
    option => option.value === savedAnnualIncome,
  );
  return {
    familySize,
    ...(isSavedIncomeStillOffered ? { annualIncome: savedAnnualIncome } : {}),
  };
};

export const InvoiceDiscountAssessmentForm = ({
  patientId,
  onClose,
  onBack,
  handleUpdateDiscount,
}) => {
  const { getTranslation } = useTranslation();
  const { getSetting } = useSettings();
  const slidingFeeScale = getSetting(SETTING_KEYS.SLIDING_FEE_SCALE);

  const { data: additionalData } = usePatientAdditionalDataQuery(patientId);

  const familySizesOptions = useMemo(
    () => getFamilySizeOptions(slidingFeeScale),
    [slidingFeeScale],
  );

  const initialValues = useMemo(
    () => getAssessmentInitialValues(slidingFeeScale, additionalData),
    [slidingFeeScale, additionalData],
  );

  // Formik re-validates whenever the schema's identity changes, so building it inline would
  // re-run validation on every render.
  const validationSchema = useMemo(
    () =>
      getAssessmentValidationSchema(
        slidingFeeScale,
        getTranslation('validation.required.inline', '*Required'),
      ),
    [slidingFeeScale, getTranslation],
  );

  const handleSubmit = async values => {
    await handleUpdateDiscount(
      getAssessmentDiscount(
        getAnnualIncomeOptions(slidingFeeScale, values.familySize),
        values.annualIncome,
      ),
    );
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
        // The patient's saved answers arrive after the first render
        enableReinitialize
        initialValues={initialValues}
        onSubmit={handleSubmit}
        render={({ submitForm, setFieldValue, values }) => {
          const annualIncomeOptions = getAnnualIncomeOptions(slidingFeeScale, values.familySize);
          return (
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
                  onChange={() => setFieldValue('annualIncome', '')}
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
                  disabled={!values.familySize}
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
          );
        }}
        validationSchema={validationSchema}
        data-testid="form-6cak"
      />
    </>
  );
};
