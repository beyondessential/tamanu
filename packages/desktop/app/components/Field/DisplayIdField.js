import React from 'react';
import { Tooltip, InputAdornment, Checkbox } from '@material-ui/core';
import SpellcheckIcon from '@material-ui/icons/Spellcheck';
import { LocalisedField } from './LocalisedField';
import { Field } from './Field';

const CheckField = ({ field, ...props }) => (
  <Tooltip title="Exact term search">
    <Checkbox
      icon={<SpellcheckIcon color="disabled" />}
      checkedIcon={<SpellcheckIcon />}
      name={field.name}
      checked={field.value || false}
      onChange={field.onChange}
      value="checked"
      color="primary"
      {...props}
    />
  </Tooltip>
);

export const DisplayIdField = () => (
  <LocalisedField
    name="displayId"
    InputProps={{
      endAdornment: (
        <InputAdornment position="end">
          <Field name="displayIdExact" component={CheckField} />
        </InputAdornment>
      ),
    }}
  />
);
