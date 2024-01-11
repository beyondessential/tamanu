import React from 'react';

import { VACCINE_CATEGORIES } from '@tamanu/constants';

import { Field, SelectField } from '../../components';

const VACCINE_CATEGORY_OPTIONS = Object.values(VACCINE_CATEGORIES).map(category => ({
  label: category,
  value: category,
}));

export const VaccineCategoryField = ({ name = 'category', required }) => (
  <Field
    name={name}
    label="Category"
    component={SelectField}
    required={required}
    options={VACCINE_CATEGORY_OPTIONS}
  />
);
