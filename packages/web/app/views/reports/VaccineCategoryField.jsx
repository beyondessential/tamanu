import React from 'react';

import { VACCINE_CATEGORIES } from '@tamanu/constants';

import { Field } from '../../components';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { TranslatedSelectField } from '../../components/Translation/TranslatedSelect';

export const VaccineCategoryField = ({ name = 'category', required }) => (
  <Field
    name={name}
    label={<TranslatedText stringId="vaccine.category.label" fallback="Category" />}
    component={TranslatedSelectField}
    required={required}
    enumValues={VACCINE_CATEGORIES}
    prefix="vaccine.property.category"
  />
);
