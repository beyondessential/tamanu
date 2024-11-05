import React, { useState } from 'react';
import {
  OutlinedInput,
  Menu,
  MenuItem,
  Checkbox,
  Box,
  IconButton,
  ListItemText,
  styled,
  Button,
  InputAdornment,
} from '@mui/material';
import { Clear, Search } from '@mui/icons-material';

import { CheckboxIconChecked, CheckboxIconUnchecked } from '../Icons/CheckboxIcon';
import { Colors } from '../../constants';
import { TextButton } from '../Button';
import { useSuggesterOptions } from '../../hooks';
import { TranslatedText } from '../Translation';
import { TextInput } from './TextField';
import { ClearIcon } from '../Icons';

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
    border: 1px solid ${props => props.theme.palette.grey['400']};
    background-color: ${Colors.white};
  }
  :focus {
    border: 1px solid ${props => props.theme.palette.primary.main};
  }
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

  return (
    <>
      <StyledInputButton variant="outlined" onClick={handleOpen} {...props}>
        {label} {value.length > 0 ? `(${value.length})` : ''}
      </StyledInputButton>

      <StyledMenu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <Box p={1} sx={{ display: 'flex', flexDirection: 'column', padding: '0 0.625rem' }}>
          <StyledTextInput
            InputProps={{
              startAdornment: (
                <Icon>
                  <Search />
                </Icon>
              ),
            }}
            placeholder={`Search ${label.toLowerCase()}`}
            style={{ paddingInlineStart: 0 }}
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            size="small"
          />
          <TextButton
            onClick={handleClear}
            style={{ textDecoration: 'underline', alignSelf: 'end', marginBlock: '0.25rem' }}
          >
            <TranslatedText stringId="general.action.clear" fallback="Clear" />
          </TextButton>
        </Box>

        <OptionsContainer>
          {options.length > 0 ? (
            options
              .filter(option => option.label.toLowerCase().includes(searchValue.toLowerCase()))
              .sort((a, b) => a.label.localeCompare(b.label))
              .map(option => (
                <MenuItem
                  key={`${name}-${option.value}`}
                  onClick={() => handleSelectOption(option.value)}
                  sx={{ paddingInline: '0.625rem', gap: '0.5625rem' }}
                >
                  <Checkbox
                    checked={value.includes(option.value)}
                    icon={<CheckboxIconUnchecked width={15} height={15} />}
                    checkedIcon={<CheckboxIconChecked width={15} height={15} />}
                    sx={{ padding: 0 }}
                  />
                  <ListItemText primary={option.label} />
                </MenuItem>
              ))
          ) : (
            <MenuItem disabled>
              <TranslatedText stringId="general.search.noDataMessage" fallback="No options found" />
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
