import React from 'react';
import styled from 'styled-components';
import { CheckField, Field } from '../Field';

const StyledCheckField = styled(CheckField)`
  top: 50%;
  left: 10px;
`;

export const SearchBarCheckField = props => <Field {...props} component={StyledCheckField} />;
