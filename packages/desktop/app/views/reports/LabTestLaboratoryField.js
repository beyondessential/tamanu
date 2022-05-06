import React from 'react';
import { connectApi } from '../../api';
import { AutocompleteField, Field } from '../../components';
import { Suggester } from '../../utils/suggester';

const DumbLabTestLaboratoryField = ({ labTestLaboratorySuggester, required }) => (
  <Field
    name="labTestLaboratory"
    label="Lab Test Laboratory"
    component={AutocompleteField}
    suggester={labTestLaboratorySuggester}
    required={required}
  />
);

export const LabTestLaboratoryField = connectApi(api => ({
  labTestLaboratorySuggester: new Suggester(api, 'labTestLaboratory'),
}))(DumbLabTestLaboratoryField);
