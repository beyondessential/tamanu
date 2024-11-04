import React, { useState } from 'react';
import {
  OutlinedInput,
  Menu,
  MenuItem,
  Checkbox,
  Box,
  IconButton,
  ListItemText,
  InputAdornment,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { CheckboxIconChecked, CheckboxIconUnchecked } from '../Icons/CheckboxIcon';
import { FilterIcon } from '../Icons/FilterIcon';
import { Colors } from '../../constants';
import { TextButton } from '../Button';

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
      ? value.filter(v => v !== optionValue) // Remove option if already selected
      : [...value, optionValue]; // Add option if not selected

    onChange({ target: { value: newSelected, name } });
  };

  const handleClear = () => {
    onChange({ target: { value: [], name } });
    setSearchValue('');
  };

  return (
    <>
      <OutlinedInput
        readOnly
        onClick={handleOpen}
        value={`${label} ${value.length > 0 ? `(${value.length})` : ''}`}
        startAdornment={
          <InputAdornment width={24} height={24} sx={{ marginRight: '0.4375rem' }}>
            <FilterIcon />
          </InputAdornment>
        }
        {...props}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            '& *': {
              fontSize: '0.6875rem', // Set your desired font size
            },
          },
          style: { width: anchorEl ? anchorEl.clientWidth : undefined, paddingInline: '0.625rem' },
        }}
      >
        <Box p={1} sx={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
          <OutlinedInput
            startAdornment={
              <IconButton edge="start" size="small" sx={{ marginRight: 0.5 }}>
                <Search fontSize="small" />
              </IconButton>
            }
            placeholder="Search..."
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
          />
          <TextButton
            onClick={handleClear}
            style={{ textDecoration: 'underline', alignSelf: 'end', marginBlock: '0.25rem' }}
          >
            Clear
          </TextButton>
        </Box>

        <Box
          style={{
            maxHeight: '11.0625rem',
            overflowY: 'auto',
            paddingBlock: '0.5rem',
            paddingInline: 0,
            borderBlockStart: `1px solid ${Colors.outline}`,
          }}
        >
          {options.length > 0 ? (
            options
              .filter(option => option.label.toLowerCase().includes(searchValue.toLowerCase()))
              .map(option => (
                <MenuItem
                  key={option.value}
                  onClick={() => handleSelectOption(option.value)}
                  sx={{ paddingInline: 0, gap: '0.5625rem' }}
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
            <MenuItem disabled>No options found</MenuItem>
          )}
        </Box>
      </Menu>
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
