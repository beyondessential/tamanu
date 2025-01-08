import React from 'react';
import Search from '@material-ui/icons/Search';
import { IconButton, InputAdornment } from '@material-ui/core';
import styled from 'styled-components';
import { ClearIcon } from './Icons/ClearIcon';
import { TextInput } from './Field/TextField';
import { Colors } from '../constants';
import { useTranslation } from '../contexts/Translation';

const Icon = styled(InputAdornment)`
  .MuiSvgIcon-root {
    color: ${Colors.softText};
    font-size: 18px;
  }
`;

const StyledTextInput = styled(TextInput)`
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

const StyledClearIcon = styled(ClearIcon)`
  cursor: pointer;
  color: ${Colors.darkText};
`;

// N.B. this is for standalone use, if you want a search field within a form, use SearchField.jsx
export const SearchInput = props => {
  const { getTranslation } = useTranslation();

  const { label, placeholder, searchValue, setSearchValue } = props;

  const clearSearch = () => {
    setSearchValue('');
  };

  return (
    <StyledTextInput
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
      placeholder={
        placeholder ?? (label ? getTranslation(label.props.stringId, label.props.fallback) : '')
      }
      value={searchValue}
      onChange={e => setSearchValue(e.target.value)}
    />
  );
};
