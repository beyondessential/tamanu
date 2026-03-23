import React from 'react';
import styled from 'styled-components';
import Search from '@material-ui/icons/Search';
import { IconButton, InputAdornment } from '@material-ui/core';

import { TextInput } from '../../../../components/Field/TextField';
import { ClearIcon } from '../../../../components/Icons/ClearIcon';
import { Colors } from '../../../../constants/styles';
import { TranslatedText } from '../../../../components/Translation/TranslatedText';

const Wrapper = styled.div`
  display: flex;
  align-items: flex-end;
  margin-inline-start: 1rem;
  flex: 1;
  max-width: 22rem;
`;

const StyledTextInput = styled(TextInput)`
  .MuiInputBase-root {
    padding-left: 10px;
  }
  .MuiInputBase-input {
    padding-left: 5px;
  }
`;

const SearchIcon = styled(InputAdornment)`
  .MuiSvgIcon-root {
    color: ${Colors.softText};
    font-size: 18px;
  }
`;

const StyledIconButton = styled(IconButton)`
  padding: 5px;
`;

const StyledClearIcon = styled(ClearIcon)`
  cursor: pointer;
  color: ${Colors.darkText};
`;

export const SettingsSearchBar = ({ searchQuery, onSearchChange, onClear }) => (
  <Wrapper data-testid="settings-search-bar">
    <StyledTextInput
      label={
        <TranslatedText
          stringId="admin.settings.search.label"
          fallback="Search settings"
          data-testid="translatedtext-settings-search-label"
        />
      }
      InputProps={{
        startAdornment: (
          <SearchIcon position="start" data-testid="settings-search-icon">
            <Search />
          </SearchIcon>
        ),
        endAdornment: searchQuery ? (
          <StyledIconButton
            onClick={onClear}
            data-testid="settings-search-clear"
            aria-label="Clear search"
          >
            <StyledClearIcon />
          </StyledIconButton>
        ) : null,
      }}
      value={searchQuery}
      onChange={e => onSearchChange(e.target.value)}
      placeholder=""
      data-testid="settings-search-input"
    />
  </Wrapper>
);
