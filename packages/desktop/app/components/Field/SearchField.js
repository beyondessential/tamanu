import React, { useEffect, useState } from 'react';
import Search from '@material-ui/icons/Search';
import { InputAdornment, IconButton } from '@material-ui/core';
import ClearRoundedIcon from '@material-ui/icons/ClearRounded';
import styled from 'styled-components';
import { CustomClearIcon } from '../Icons/CustomClearIcon';
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

const StyledIconButton = styled(IconButton)`
  padding: 5px;
`;

const StyledClearIcon = styled(CustomClearIcon)`
  cursor: pointer;
  color: ${Colors.darkText};
`;

export const SearchField = props => {
  const {
    field: { value },
  } = props;
  const [searchValue, setSearchValue] = useState(value);

  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  const clearSearch = () => {
    setSearchValue('');
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
      placeholder={props?.label ? `Search ${props?.label.toLowerCase()}` : ''}
      {...props}
      value={searchValue}
    />
  );
};
