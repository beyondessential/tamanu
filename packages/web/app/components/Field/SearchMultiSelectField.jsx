import React, { useState } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import Box from '@mui/material/Box';
import ListItemText from '@mui/material/ListItemText';
import styled from '@mui/system/styled';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import Search from '@mui/icons-material/Search';

import { CheckboxIconChecked, CheckboxIconUnchecked } from '../Icons/CheckboxIcon';
import { Colors } from '../../constants';
import { useSuggesterOptions } from '../../hooks';
import { TranslatedText } from '../Translation';
import { TextInput, TextButton } from '@tamanu/ui-components';

const StyledTextInput = styled(TextInput)`
  .MuiInputBase-input {
    padding-inline-start: 0.4375rem;
  }
`;

const Icon = styled(InputAdornment)`
  .MuiSvgIcon-root {
    color: ${Colors.softText};
    font-size: 0.9375rem;
  }

  font-size: 0.9375rem; // prevent font size from being inherited from parent
`;

const StyledMenu = styled(Menu)`
  .MuiMenu-paper {
    width: 12.875rem;
    & * {
      font-size: 0.6875rem;
    }
  }
`;

const OptionsContainer = styled(Box)`
  max-height: 11.0625rem;
  overflow-y: auto;
  padding-block: 0.5rem;
  padding-inline: 0;
  border-block-start: 1px solid ${Colors.outline};
`;

const StyledInputButton = styled(Button)`
  color: ${Colors.darkText};
  font-size: 0.875rem;
  line-height: 1.125rem;
  padding-inline: 0.9375rem;
  text-transform: none;
  border: 1px solid ${Colors.outline};
  :hover {
    background-color: ${Colors.veryLightBlue};
    border-color: ${Colors.outline};
  }

  ${({ $highlight }) => {
    return (
      $highlight &&
      `
        background-color: #cfe3f6;
        border-color: ${Colors.outline};
        color: ${Colors.darkestText};
      `
    );
  }}

  ${({ $open }) =>
    $open &&
    `
      border-color: ${Colors.primary};
    `}
`;

const SearchContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  padding: 0 0.625rem;
`;

const StyledTextButton = styled(TextButton)`
  margin-block: 0.25rem;
  text-decoration: underline;
  align-self: end;
`;

const StyledMenuItem = styled(MenuItem)`
  padding-inline: 0.625rem;
  gap: 0.5625rem;
`;

export const SearchMultiSelectInput = ({
  value = [],
  onChange,
  name,
  label,
  options = [],
  ...props
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchValue, setSearchValue] = useState('');

  const handleOpen = event => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleSelectOption = optionValue => {
    const newSelected = value.includes(optionValue)
      ? value.filter(v => v !== optionValue) // remove if already selected
      : [...value, optionValue]; // add if not selected

    onChange({ target: { value: newSelected, name } });
  };

  const handleClear = () => {
    onChange({ target: { value: [], name } });
    setSearchValue('');
  };

  const shouldShowSearch = options?.length > 10;

  return (
    <>
      <StyledInputButton
        $highlight={value.length > 0}
        $open={Boolean(anchorEl)}
        variant="outlined"
        onClick={handleOpen}
        {...props}
      >
        {label} {value.length > 0 ? `(${value.length})` : ''}
      </StyledInputButton>
      <StyledMenu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        data-testid={`styledmenu-j04h-${name}`}
      >
        <SearchContainer data-testid={`searchcontainer-4ydp-${name}`}>
          {shouldShowSearch && (
            <StyledTextInput
              InputProps={{
                startAdornment: (
                  <Icon data-testid={`icon-ulci-${name}`}>
                    <Search data-testid={`search-clu1-${name}`} />
                  </Icon>
                ),
              }}
              placeholder={`Search ${label.toLowerCase()}`}
              style={{ paddingInlineStart: 0 }}
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              size="small"
              data-testid={`styledtextinput-ryvy-${name}`}
            />
          )}
          <StyledTextButton onClick={handleClear} data-testid={`styledtextbutton-mth0-${name}`}>
            <TranslatedText
              stringId="general.action.clear"
              fallback="Clear"
              data-testid={`translatedtext-hxyt-${name}`}
            />
          </StyledTextButton>
        </SearchContainer>

        <OptionsContainer data-testid={`optionscontainer-nneh-${name}`}>
          {options.length > 0 ? (
            options
              .filter(option => option.label.toLowerCase().includes(searchValue.toLowerCase()))
              .sort((a, b) => a.label.localeCompare(b.label))
              .map(option => (
                <StyledMenuItem
                  key={`${name}-${option.value}`}
                  onClick={() => handleSelectOption(option.value)}
                  data-testid={`styledmenuitem-8ebf-${name}-${option.value}`}
                >
                  <Checkbox
                    checked={value.includes(option.value)}
                    icon={
                      <CheckboxIconUnchecked
                        width={15}
                        height={15}
                        data-testid={`checkboxiconunchecked-aqdj-${option.value}`}
                      />
                    }
                    checkedIcon={
                      <CheckboxIconChecked
                        width={15}
                        height={15}
                        data-testid={`checkboxiconchecked-1zsb-${option.value}`}
                      />
                    }
                    sx={{ padding: 0 }}
                    data-testid={`checkbox-hyuw-${name}-${option.value}`}
                  />
                  <ListItemText
                    primary={option.label}
                    data-testid={`listitemtext-pqs6-${name}-${option.value}`}
                  />
                </StyledMenuItem>
              ))
          ) : (
            <MenuItem disabled data-testid={`menuitem-n0tf-${name}`}>
              <TranslatedText
                stringId="general.search.noDataMessage"
                fallback="No options found"
                data-testid={`translatedtext-lpri-${name}`}
              />
            </MenuItem>
          )}
        </OptionsContainer>
      </StyledMenu>
    </>
  );
};

export const SearchMultiSelectField = ({ field, options, label, ...props }) => (
  <SearchMultiSelectInput
    name={field.name}
    value={field.value || []}
    onChange={field.onChange}
    label={label}
    options={options}
    {...props}
    data-testid={`searchmultiselectinput-ptb5-${field.name}`}
  />
);

export const SuggesterSearchMultiSelectField = ({
  field,
  endpoint,
  baseQueryParameters,
  filterByFacility,
  baseOptions = [],
  ...props
}) => {
  const options = useSuggesterOptions({
    field,
    endpoint,
    baseQueryParameters,
    filterByFacility,
    baseOptions,
    isMulti: true,
  });

  const baseProps = {
    name: field.name,
    onChange: field.onChange,
    value: field.value,
    options,
  };

  return <SearchMultiSelectInput {...baseProps} {...props} />;
};
