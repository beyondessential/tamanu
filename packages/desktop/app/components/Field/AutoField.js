import React from 'react';

import { FastField } from 'formik';

import { SelectField } from './SelectField';
import { TextField } from './TextField';
import { CheckField } from './CheckField';
import { NumberField } from './NumberField';
import { DateField } from './DateField';
import { RelationField } from './RelationField';

function getComponentForField({ type, ...definition }) {
  switch(type) {
    case 'string':
      if(definition.options) {
        return SelectField;
      } else {
        return TextField;
      }
    case 'bool':
      return CheckField;
    case 'float':
    case 'int':
      return NumberField;
    case 'date':
      return DateField;
    default:
      return TextField;
  }
}

export const AutoField = ({ definitions, field, ...overrides }) => {
  const definition = definitions[field];
  const { type, isRelation, ...otherProps } = definition;

  if(isRelation) {
    return (
      <FastField 
        name={field}
        type={type} 
        component={ RelationField }
        {...otherProps} 
      />
    );
  }

  const component = getComponentForField(definition);

  return (
    <FastField
      name={field}
      component={component}
      {...otherProps}
      {...overrides}
    />
  );
};

export const MultiAutoField = ({ definitions, fields }) => {
  return fields.map(f => (
    <AutoField 
      key={f} 
      field={f}
      definitions={definitions} 
    />
  ));
};
