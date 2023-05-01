import React from 'react';
import Search from '@material-ui/icons/Search';
import { InputAdornment } from '@material-ui/core';
import styled from 'styled-components';
import { TextField } from './TextField';
import { Colors } from '../../constants';

const Icon = styled(InputAdornment)`
  .MuiSvgIcon-root {
    color: ${Colors.softText};
    font-size: 18px;
  }
`;

const StyledTextField = styled(TextField)`
  .MuiInputBase-root {
    padding-left: 10px;
  }
  .MuiInputBase-input {
    padding-left: 5px;
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
