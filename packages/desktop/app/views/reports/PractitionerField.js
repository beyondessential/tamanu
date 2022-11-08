import React from 'react';
import { connectApi } from '../../api';
import { AutocompleteField, Field } from '../../components';
import { Suggester } from '../../utils/suggester';

const DumbPractitionerField = ({ name = 'practitioner', practitionerSuggester, required }) => (
  <Field
    name={name}
    label="Doctor/nurse"
    component={AutocompleteField}
    suggester={practitionerSuggester}
    required={required}
  />
);

export const PractitionerField = connectApi(api => ({
  practitionerSuggester: new Suggester(api, 'practitioner'),
}))(DumbPractitionerField);
