import {
  Checkbox,
  FormControl,
  Icon,
  InputBase,
  ListItemText,
  ListSubheader,
  MenuItem,
  OutlinedInput,
  Select,
  styled,
  TextField,
  useTheme,
} from '@mui/material';
import React, { useCallback, useState } from 'react';
import { StyledTextField } from './TextField';
import { Search } from '@mui/icons-material';
import { TextButton } from '../Button';
import { Divider, Input } from '@material-ui/core';
import { TranslatedText } from '../Translation';
import { Colors } from '../../constants';

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

const StyledSubheader = styled(ListSubheader)`
  padding-block: 0.5rem 0.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-block-end: 0.5rem;
`;

const StyledOutlinedInput = styled(OutlinedInput)`
  background: ${props => (props.disabled ? 'inherit' : Colors.white)};

  // Hover state
  &:hover .MuiOutlinedInput-notchedOutline {
    border-color: ${props => props.theme.palette.grey['400']};
  }

  // Focused state
  &.Mui-focused .MuiOutlinedInput-notchedOutline {
    border: 1px solid ${props => props.theme.palette.primary.main};
  }
`;

const SearchMultiSelectInput = ({ options, onChange, name, size = 'small' }) => {
  const theme = useTheme();
  console.log(theme);

  const [searchValue, setSearchValue] = useState('');
  const [selectedOptions, setSelectedOptions] = useState([]);

  const filteredOptions = options.filter(
    option =>
      option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
      selectedOptions.includes(option.value),
  );

  const handleChange = useCallback(
    event => {
      const value = event.target.value;
      setSelectedOptions(value);
      onChange({ target: { value: JSON.stringify(value), name } }); // Send the updated values to the parent
    },
    [onChange, name],
  );

  return (
    <Select
      multiple
      value={selectedOptions}
      onChange={handleChange}
      displayEmpty
      renderValue={selected => (selected.length === 0 ? name : `${name} (${selected.length})`)}
      MenuProps={MenuProps}
      input={<StyledOutlinedInput />}
      IconComponent={null}
      size={size}
      variant="outlined"
    >
      <StyledSubheader>
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
          onClick={() => setSelectedOptions([])} // Clears selection
        >
          <TranslatedText stringId="general.action.clear" fallback="Clear" />
        </TextButton>
        <Divider />
      </StyledSubheader>

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
