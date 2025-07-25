import { ReactElement } from 'react';

import { labels } from '~/ui/navigation/screens/home/PatientDetails/labels';
import { LocalisedField } from '../LocalisedField';
import { TextField } from '../../TextField/TextField';
import { StyledView } from '~/ui/styled/common';

export const PlainField = ({ fieldName, required }): ReactElement => (
  // Outer styled view to momentarily add distance between fields
  <StyledView key={fieldName} paddingTop={15}>
    <LocalisedField
      label={labels[fieldName]}
      name={fieldName}
      component={TextField}
      required={required}
    />
  </StyledView>
);
