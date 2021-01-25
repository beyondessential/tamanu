import React from 'react';
import { connectApi } from '../../api';
import { AutocompleteField, Field } from '../../components';
import { Suggester } from '../../utils/suggester';

const DumbPractitionerField = ({ practitionerSuggester, required }) => {
  return (
    <Field
      name="practitioner"
      label="Doctor/Nurse"
      component={AutocompleteField}
      suggester={practitionerSuggester}
      require={required}
    />
  );
};

export const PractitionerField = connectApi(api => ({
  practitionerSuggester: new Suggester(api, 'practitioner'),
}))(DumbPractitionerField);
