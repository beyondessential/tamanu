import { Checkbox, Icon, ListItemText, ListSubheader, Menu, MenuItem, Select } from '@mui/material';
import React, { useCallback, useState } from 'react';
import { StyledTextField } from './TextField';
import { Search } from '@mui/icons-material';
import { TextButton } from '../Button';
import { Divider } from '@material-ui/core';

const MenuProps = {
  PaperProps: {
    sx: {
      maxHeight: 300,
    },
  },
  MenuListProps: {
    sx: {
      paddingTop: 0,
    },
  },
  autoFocus: false,
};

const SearchMultiSelectInput = ({ options, onChange, name }) => {
  const [searchValue, setSearchValue] = useState('');
  const [selectedOptions, setSelectedOptions] = useState([]);

  const filteredOptions = options.filter(
    option =>
      option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
      selectedOptions.includes(option.value),
  );

  const handleChange = useCallback(
    selectedOptions => {
      setSelectedOptions(selectedOptions);
      const newValue = JSON.stringify(selectedOptions.map(x => x.value));
      onChange({ target: { value: newValue, name } });
    },
    [onChange, name],
  );

  return (
    <Select onChange={handleChange} MenuProps={MenuProps}>
      <ListSubheader
        sx={{
          paddingBlockStart: '0.5rem',
          paddingBlocKEnd: '0.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          marginBlockEnd: '0.5rem',
        }}
      >
        <StyledTextField
          autoFocus
          variant="outlined"
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          onKeyDown={e => e.stopPropagation()}
          InputProps={{
            startAdornment: (
              <Icon position="start">
                <Search />
              </Icon>
            ),
          }}
          style={{ width: '100%' }}
          placeholder="Search..."
        />
        <TextButton
          style={{ alignSelf: 'end', fontSize: '11px', textDecoration: 'underline' }}
          onClick={() => setSelectedOptions([])}
        >
          Clear
        </TextButton>
        <Divider />
      </ListSubheader>
      {filteredOptions.length > 0 ? (
        filteredOptions.map(option => (
          <MenuItem key={option.value} value={option.value}>
            <Checkbox checked={selectedOptions.includes(option.value)} />
            <ListItemText primary={option.label} />
          </MenuItem>
        ))
      ) : (
        <MenuItem disabled>No options found</MenuItem>
      )}
    </Select>
  );
};

export const SearchMultiSelectField = ({ field, options }) => {
  const { name, value, onChange } = field;

  return <SearchMultiSelectInput options={options} onChange={onChange} name={name} value={value} />;
};
