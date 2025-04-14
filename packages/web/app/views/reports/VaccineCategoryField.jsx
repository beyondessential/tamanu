import React from 'react';

import { VACCINE_CATEGORY_LABELS } from '@tamanu/constants';

import { Field, TranslatedSelectField } from '../../components';
import { TranslatedText } from '../../components/Translation/TranslatedText';

export const VaccineCategoryField = ({ name = 'category', required, label }) => (
  <Field
    name={name}
    label={
      label ?? (
        <TranslatedText
          stringId="vaccine.category.label"
          fallback="Category"
          data-testid="translatedtext-oivm"
        />
      )
    }
    component={TranslatedSelectField}
    required={required}
    enumValues={VACCINE_CATEGORY_LABELS}
    data-testid="field-057m"
  />
);
