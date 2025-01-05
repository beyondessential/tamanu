import React, { useEffect, useState } from 'react';
import Search from '@material-ui/icons/Search';
import { IconButton, InputAdornment } from '@material-ui/core';
import styled from 'styled-components';
import { ClearIcon } from '../Icons/ClearIcon';
import { TextField } from './TextField';
import { Colors } from '../../constants';
import { useTranslation } from '../../contexts/Translation';

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

const StyledClearIcon = styled(ClearIcon)`
  cursor: pointer;
  color: ${Colors.darkText};
`;

export const SearchField = props => {
  const { getTranslation } = useTranslation();

  const {
    field: { value, name },
    form: { setFieldValue } = {},
    label,
    placeholder,
    onChange,
  } = props;
  const [searchValue, setSearchValue] = useState(value);

  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  const clearSearch = () => {
    setSearchValue('');
    setFieldValue?.(name, '');

    // For some reason, using `clearSearch` doesn’t fire the `SearchField`’s change event
    onChange?.({
      target: {
        value: '',
        type: 'change',
      },
    });
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
      {...props}
      placeholder={
        placeholder ?? (label ? getTranslation(label.props.stringId, label.props.fallback) : '')
      }
      value={searchValue}
    />
  );
};
