import { ReactElement } from 'react';

import { labels } from '~/ui/navigation/screens/home/PatientDetails/labels';
import { LocalisedField } from '../LocalisedField';
import { selectFieldsOptions } from './helpers';
import { Dropdown } from '../../Dropdown';

export const SelectField = ({ fieldName, required }): ReactElement => (
  <LocalisedField
    key={fieldName}
    name={fieldName}
    label={labels[fieldName]}
    options={selectFieldsOptions[fieldName]}
    component={Dropdown}
    required={required}
  />
);
