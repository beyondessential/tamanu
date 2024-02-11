import React from 'react';

import { VACCINE_CATEGORIES } from '@tamanu/constants';

import { SelectField, Field } from '../../components';
import { TranslatedText } from '../../components/Translation/TranslatedText';

const VACCINE_CATEGORY_OPTIONS = Object.values(VACCINE_CATEGORIES).map(category => ({
  label: category,
  value: category,
}));

export const VaccineCategoryField = ({ name = 'category', required }) => (
  <Field
    name={name}
    label={<TranslatedText stringId="report.parameter.vaccineCategory.label" fallback="Category" />}
    component={SelectField}
    required={required}
    options={VACCINE_CATEGORY_OPTIONS}
  />
);
