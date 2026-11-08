import React, { useMemo } from 'react';
import { useFormikContext } from 'formik';

import { SETTING_KEYS } from '@tamanu/constants';

import {
  AutocompleteField,
  SelectField,
  SuggesterSelectField,
  TextField,
} from '../../../../../components';
import { ConfiguredMandatoryPatientFields } from '../../../ConfiguredMandatoryPatientFields';
import { usePatientPayorSuggester } from '../../../../../api';
import { useSlidingFeeScalePlanId } from '../../../../../api/queries';
import { TranslatedText } from '../../../../../components/Translation/TranslatedText';
import { useSettings } from '../../../../../contexts/Settings';
import {
  getAnnualIncomeOptions,
  getFamilySizeOptions,
  withSavedAnnualIncome,
} from '../../../../../utils/slidingFeeScale';

export const GenericBillingFields = ({ filterByMandatory, heading, headingTestId, gridTestId }) => {
  const { getSetting } = useSettings();
  const { values, setFieldValue } = useFormikContext();
  const payor1Suggester = usePatientPayorSuggester();
  const payor2Suggester = usePatientPayorSuggester();

  const enablePatientInsurer = getSetting('features.enablePatientInsurer');
  const slidingFeeScale = getSetting(SETTING_KEYS.SLIDING_FEE_SCALE);

  const { familySize, annualIncome, invoiceInsurancePlanId } = values;

  // Choosing the sliding fee scale plan is what makes these two an answer the patient owes, so
  // they are marked required the moment it is selected rather than only on Save.
  const { slidingFeeScalePlanId } = useSlidingFeeScalePlanId();
  const isSlidingFeeScaleSelected =
    Boolean(slidingFeeScalePlanId) &&
    (invoiceInsurancePlanId || []).includes(slidingFeeScalePlanId);

  const familySizeOptions = useMemo(() => getFamilySizeOptions(slidingFeeScale), [slidingFeeScale]);
  const annualIncomeOptions = useMemo(
    () => withSavedAnnualIncome(getAnnualIncomeOptions(slidingFeeScale, familySize), annualIncome),
    [slidingFeeScale, familySize, annualIncome],
  );

  const BILLING_FIELDS = {
    insurerPolicyNumber: {
      component: TextField,
      condition: () => !!enablePatientInsurer,
      label: (
        <TranslatedText
          stringId="general.localisedField.insurerPolicyNumber.label"
          fallback="Insurance policy number"
          data-testid="translatedtext-kpjh"
        />
      ),
    },
    invoiceInsurancePlanId: {
      component: SuggesterSelectField,
      endpoint: 'invoiceInsurancePlan',
      isMulti: true,
      label: (
        <TranslatedText
          stringId="general.localisedField.invoiceInsurancePlanId.label"
          fallback="Insurance plan"
          data-testid="translatedtext-73e2"
        />
      ),
    },
    patientBillingTypeId: {
      component: SuggesterSelectField,
      endpoint: 'patientBillingType',
      label: (
        <TranslatedText
          stringId="general.localisedField.patientBillingTypeId.label"
          fallback="Patient type"
          data-testid="translatedtext-c6cp"
        />
      ),
    },
    familySize: {
      component: SelectField,
      options: familySizeOptions,
      required: isSlidingFeeScaleSelected || undefined,
      // The bands belong to a family size, so an income chosen against the old one is no longer
      // an answer to this question.
      onChange: () => setFieldValue('annualIncome', ''),
      label: (
        <TranslatedText stringId="general.localisedField.familySize.label" fallback="Family size" />
      ),
    },
    annualIncome: {
      component: SelectField,
      options: annualIncomeOptions,
      disabled: !familySize,
      required: isSlidingFeeScaleSelected || undefined,
      label: (
        <TranslatedText
          stringId="general.localisedField.annualIncome.label"
          fallback="Annual income"
        />
      ),
    },
    payor1Id: {
      component: AutocompleteField,
      suggester: payor1Suggester,
      label: <TranslatedText stringId="general.localisedField.payor1Id.label" fallback="Payor 1" />,
    },
    payor1ReferenceNumber: {
      component: TextField,
      label: (
        <TranslatedText
          stringId="general.localisedField.payor1ReferenceNumber.label"
          fallback="Payor 1 reference number"
        />
      ),
    },
    payor2Id: {
      component: AutocompleteField,
      suggester: payor2Suggester,
      label: <TranslatedText stringId="general.localisedField.payor2Id.label" fallback="Payor 2" />,
    },
    payor2ReferenceNumber: {
      component: TextField,
      label: (
        <TranslatedText
          stringId="general.localisedField.payor2ReferenceNumber.label"
          fallback="Payor 2 reference number"
        />
      ),
    },
  };

  return (
    <ConfiguredMandatoryPatientFields
      fields={BILLING_FIELDS}
      filterByMandatory={filterByMandatory}
      heading={heading}
      headingTestId={headingTestId}
      gridTestId={gridTestId}
      data-testid="configuredmandatorypatientfields-billing"
    />
  );
};
