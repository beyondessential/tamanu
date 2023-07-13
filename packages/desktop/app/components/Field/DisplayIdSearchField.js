import React from 'react';
import styled from 'styled-components';
import { Tooltip, InputAdornment } from '@material-ui/core';
import SpellcheckIcon from '@material-ui/icons/Spellcheck';
import { LocalisedField } from './LocalisedField';
import { Field } from './Field';
import { SearchField } from './SearchField';
import { CheckControl } from './CheckField';

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
    <CheckControl
      icon={<SpellcheckIcon color="disabled" />}
      checkedIcon={<SpellcheckIcon />}
      name={field.name}
      value={field.value}
      onChange={field.onChange}
      color="primary"
    />
  </Tooltip>
);

export const DisplayIdSearchField = props => (
  <FieldContainer
    {...props}
    name="displayId"
    className="display-field"
    component={SearchField}
    InputProps={{
      endAdornment: (
        <InputAdornment position="end">
          <Field name="displayIdExact" component={CheckField} />
        </InputAdornment>
      ),
    }}
  />
);
