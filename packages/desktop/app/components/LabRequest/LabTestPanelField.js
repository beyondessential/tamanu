import React from 'react';
import styled from 'styled-components';

import { SuggesterSelectField, Field } from '..';

const StyledSuggesterSelectField = styled(SuggesterSelectField)`
  .MuiInputBase-input.Mui-disabled {
    background: #f3f5f7;
  }
`;

export const LabTestPanelField = ({ name = 'labTestPanelId', required, disabled }) => (
  <Field
    name={name}
    label="Test panel"
    component={StyledSuggesterSelectField}
    endpoint="labTestPanel"
    required={required}
    disabled={disabled}
  />
);
