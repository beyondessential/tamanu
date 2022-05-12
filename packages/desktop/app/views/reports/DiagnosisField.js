import React from 'react';
import { connectApi } from '../../api';
import { AutocompleteField, Field } from '../../components';
import { Suggester } from '../../utils/suggester';

const DumbDiagnosisField = ({ icd10Suggester, required, name, label }) => (
  <Field
    name={name}
    label={label}
    component={AutocompleteField}
    suggester={icd10Suggester}
    required={required}
  />
);

export const DiagnosisField = connectApi(api => ({
  icd10Suggester: new Suggester(api, 'icd10'),
}))(DumbDiagnosisField);
