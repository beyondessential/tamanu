import React from 'react';

import { SelectField } from './SelectField';

export const RelationField = ({ type, ...props }) => (
  <SelectField
    {...props}
    options={[
      { value: `${type}-1`, label: `${type} #1` },
      { value: `${type}-2`, label: `${type} #2` },
      { value: `${type}-3`, label: `${type} #3` },
    ]}
    helperText="Work in progress"
  />
);
