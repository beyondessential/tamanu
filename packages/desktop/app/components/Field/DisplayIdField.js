import React from 'react';
import styled from 'styled-components';
import { Tooltip, InputAdornment, Checkbox } from '@material-ui/core';
import SpellcheckIcon from '@material-ui/icons/Spellcheck';
import { LocalisedField } from './LocalisedField';
import { Field } from './Field';

const FieldContainer = styled(LocalisedField)`
  .MuiOutlinedInput-adornedEnd {
    padding-right: 0;
  }

  .MuiInputAdornment-positionEnd {
    margin-left: 1px;
  }
`;

const CheckField = ({ field }) => (
  <Tooltip title="Exact term search">
    <Checkbox
      icon={<SpellcheckIcon color="disabled" />}
      checkedIcon={<SpellcheckIcon />}
      name={field.name}
      checked={!!field.value}
      onChange={field.onChange}
      value="checked"
      color="primary"
    />
  </Tooltip>
);

export const DisplayIdField = () => (
  <FieldContainer
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
