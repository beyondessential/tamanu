import React, { useEffect, useState } from 'react';
import Search from '@material-ui/icons/Search';
import { InputAdornment, IconButton } from '@material-ui/core';
import styled from 'styled-components';
import { ClearIcon } from '../Icons/ClearIcon';
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

const StyledIconButton = styled(IconButton)`
  padding: 5px;
`;

const StyledClearIcon = styled(ClearIcon)`
  cursor: pointer;
  color: ${Colors.darkText};
`;

export const SearchField = ({ keepLetterCase = false, ...props }) => {
  const {
    field: { value, name },
    form: { setFieldValue } = {},
    label,
  } = props;
  const [searchValue, setSearchValue] = useState(value);

  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  const clearSearch = () => {
    setSearchValue('');
    if (setFieldValue) {
      setFieldValue(name, '');
    }
  };

  return (
    <StyledTextField
      InputProps={{
        startAdornment: (
          <Icon position="start">
            <Search />
          </Icon>
        ),
        endAdornment: searchValue && (
          <StyledIconButton onClick={clearSearch}>
            <StyledClearIcon />
          </StyledIconButton>
        ),
      }}
      placeholder={label ? `Search ${keepLetterCase ? label : label.toLowerCase()}` : ''}
      {...props}
      value={searchValue}
    />
  );
};
