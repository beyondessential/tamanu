import React, { useMemo } from 'react';
import Search from '@material-ui/icons/Search';
import { InputAdornment } from '@material-ui/core';
import styled from 'styled-components';
import { TextField } from './TextField';
import { Colors } from '../../constants';

const Icon = styled(InputAdornment)`
  .MuiSvgIcon-root {
    color: ${Colors.softText};
    font-size: 13px;
  }
`;

const StyledTextField = styled(TextField)`
  .MuiInputBase-input {
    padding-left: 7px;
  }
`;

export const SearchField = props => {
  return (
    <StyledTextField
      InputProps={{
        startAdornment: (
          <Icon position="start">
            <Search />
          </Icon>
        ),
      }}
      placeholder={props?.label ? `Search ${props?.label.toLowerCase()}` : ''}
      {...props}
    />
  );
};
