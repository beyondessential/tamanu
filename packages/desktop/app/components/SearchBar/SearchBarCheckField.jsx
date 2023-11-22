import React from 'react';
import styled from 'styled-components';
import { Field, CheckField } from '../Field';

const StyledCheckField = styled(CheckField)`
  top: 50%;
  left: 10px;
`;

export const SearchBarCheckField = props => <Field {...props} component={StyledCheckField} />;
