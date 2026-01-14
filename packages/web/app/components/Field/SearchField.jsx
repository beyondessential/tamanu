import React, { useEffect, useState } from 'react';
import Search from '@material-ui/icons/Search';
import { IconButton, InputAdornment } from '@material-ui/core';
import styled from 'styled-components';
import { ClearIcon } from '../Icons/ClearIcon';
import { TextInput } from './TextField';
import { Colors } from '../../constants';
import { useTranslation } from '../../contexts/Translation';

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

// N.B. this is specifically for use within forms, you may also want to use the `SearchInput`
// component for standalone search fields
export const SearchField = props => {
  const {
    field: { value, name, onChange },
    form: { setFieldValue } = {},
  } = props;
  const [searchValue, setSearchValue] = useState(value);

  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  const clearSearch = () => {
    setSearchValue('');
    onChange?.({ target: { value: '', name } });
    setFieldValue?.(name, '');
  };

  return (
    <SearchInput
      {...props}
      name={name}
      value={searchValue}
      onChange={onChange}
      onClear={clearSearch}
    />
  );
};

// N.B. this is for standalone use, if you want a search field within a form, use SearchField.jsx
export const SearchInput = props => {
  const { getTranslation } = useTranslation();

  const { label, placeholder, value, onChange, onClear } = props;

  return (
    <StyledTextInput
      InputProps={{
        startAdornment: (
          <Icon position="start" data-testid="icon-5uu4">
            <Search data-testid="search-ne6p" />
          </Icon>
        ),
        endAdornment: value && (
          <StyledIconButton onClick={onClear} data-testid="stylediconbutton-l48b">
            <StyledClearIcon data-testid="styledclearicon-ywim" />
          </StyledIconButton>
        ),
      }}
      {...props}
      placeholder={
        placeholder ?? (label ? getTranslation(label.props.stringId, label.props.fallback) : '')
      }
      value={value}
      onChange={onChange}
    />
  );
};
