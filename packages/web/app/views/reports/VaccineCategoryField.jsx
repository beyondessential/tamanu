import React from 'react';

import { VACCINE_CATEGORIES } from '@tamanu/constants';

import { Field, BaseSelectField } from '../../components';
import { TranslatedSelectField } from '../../components/Translation/TranslatedSelectField.jsx';

const VACCINE_CATEGORY_OPTIONS = Object.values(VACCINE_CATEGORIES).map(category => ({
  label: category,
  value: category,
}));

export const VaccineCategoryField = ({ name = 'category', required }) => (
  <Field
    name={name}
    label="Category"
    component={TranslatedSelectField}
    required={required}
    options={VACCINE_CATEGORY_OPTIONS}
    prefix="vaccine.property.category"
  />
);
