import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Checkbox,
  MenuItem,
  TextField,
  ListItemText,
  FormControl,
  Select,
  InputAdornment,
  ListSubheader,
  Icon,
  Divider,
} from '@mui/material';
import styled from 'styled-components';
import { FilterIcon } from '../Icons/FilterIcon';
import { TranslatedText } from '../Translation';
import { Colors } from '../../constants';
import { SearchField } from './SearchField';
import { Search } from '@mui/icons-material';

const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: 300,
    },
  },
};

const StyledFormControl = styled(FormControl)`
  display: flex;
  flex-direction: column;
`;

const StyledSelect = styled(Select)`
  .base--active {
    background-color: ${Colors.background};
  }
`;

const FilterField = ({ options, value, onChange, label, name }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOptions, setSelectedOptions] = useState(value || []);

  const filteredOptions = options.filter(
    option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      selectedOptions.includes(option.value),
  );

  // Handle checkbox selection
  const handleCheckboxChange = useCallback(
    optionValue => {
      const updatedSelection = selectedOptions.includes(optionValue)
        ? selectedOptions.filter(value => value !== optionValue)
        : [...selectedOptions, optionValue];

      setSelectedOptions(updatedSelection);
      onChange({ target: { name, value: updatedSelection } }); // Call the onChange prop
    },
    [selectedOptions, onChange, name],
  );

  // Sync external changes to value prop with selected options
  useEffect(() => {
    setSelectedOptions(value || []);
  }, [value]);

  return (
    <StyledSelect
      multiple
      value={selectedOptions}
      renderValue={selected =>
        selected.length > 0 ? (
          <TranslatedText
            stringId="general.filter.innerLabel"
            fallback=":label (:length)"
            replacements={{ label: label, length: selected.length }}
          />
        ) : (
          label
        )
      }
      displayEmpty
      startAdornment={
        <InputAdornment position="start">
          <FilterIcon />
        </InputAdornment>
      }
      slotProps={{
        listbox: {
          maxHeight: '300px',
        },
      }}
      MenuProps={MenuProps}
    >
      <ListSubheader>
        <TextField
          slotProps={{
            input: {
              startAdornment: (
                <Icon>
                  <Search />
                </Icon>
              ),
            },
          }}
          startAdornment={
            <Icon>
              <Search />
            </Icon>
          }
          placeholder="Search options..."
          fullWidth
          size="small"
          value={searchTerm}
          onKeyDown={e => e.stopPropagation()} // Prevent auto focus change
          onChange={e => setSearchTerm(e.target.value)}
        />
        <Divider />
      </ListSubheader>
      {filteredOptions.length > 0 ? (
        filteredOptions.map(option => (
          <MenuItem key={option.value} onClick={() => handleCheckboxChange(option.value)}>
            <Checkbox checked={selectedOptions.includes(option.value)} />
            <ListItemText primary={option.label} />
          </MenuItem>
        ))
      ) : (
        <MenuItem disabled>No options found</MenuItem>
      )}
    </StyledSelect>
  );
};

export default FilterField;
