import React from 'react';
import styled from 'styled-components';
import { DateField } from './DateField';
import { Field } from './Field';

const JoinedField = styled(Field)`
  position: relative;

  .MuiInputBase-root:after {
    position: absolute;
    top: 50%;
    left: 100%;
    width: 50px;
    height: 1px;
    background: ${props => props.theme.palette.grey['400']};
    content: '';
  }
`;

export const DOBFields = () => (
  <>
    <Field name="dateOfBirthExact" component={DateField} label="DOB" />
    <JoinedField name="dateOfBirthFrom" component={DateField} label="DOB from" />
    <Field name="dateOfBirthTo" component={DateField} label="DOB to" />
  </>
);
