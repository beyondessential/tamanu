import {
  Checkbox,
  Icon,
  ListItemText,
  ListSubheader,
  MenuItem,
  OutlinedInput,
  Select,
  styled,
} from '@mui/material';
import React, { useCallback, useState } from 'react';
import { StyledTextField } from './TextField';
import { ExpandMore, Search } from '@mui/icons-material';
import { TextButton } from '../Button';
import { Divider } from '@material-ui/core';
import { TranslatedText } from '../Translation';
import { Colors } from '../../constants';
import { CheckboxIconChecked, CheckboxIconUnchecked } from '../Icons/CheckboxIcon';

const MenuProps = {
  PaperProps: {
    sx: {
      maxHeight: '244px',
      paddingInline: '0.625rem',
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

const SearchMultiSelectInput = ({ options, onChange, name, size = 'small', ...props }) => {
  const [open, setOpen] = useState(false);

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
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      multiple
      value={selectedOptions}
      onChange={handleChange}
      displayEmpty
      renderValue={selected => (selected.length === 0 ? name : `${name} (${selected.length})`)}
      MenuProps={MenuProps}
      IconComponent={ExpandMore}
      input={<StyledOutlinedInput />}
      size={size}
    >
      <StyledSubheader
        onClick={e => e.stopPropagation()}
        sx={{ padding: 0, paddingBlockStart: '0.5625rem' }}
      >
        <StyledTextField
          autoFocus
          variant="outlined"
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          onKeyDown={e => e.stopPropagation()}
          InputProps={{
            startAdornment: (
              <Icon position="start" sx={{ padding: 0, marginLeft: '-6px' }}>
                <Search sx={{ width: 13, padding: 0 }} />
              </Icon>
            ),
          }}
          size="small"
          style={{ width: '100%', paddingLeft: 0 }}
          placeholder={`Search ${name}`}
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
          <MenuItem
            key={option.value}
            value={option.value}
            sx={{
              padding: 0,
              '&.Mui-selected': {
                backgroundColor: 'transparent',
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)', // Optional: keep hover effect
              },
            }}
          >
            <Checkbox
              checked={selectedOptions.includes(option.value)}
              icon={<CheckboxIconUnchecked width={15} height={15} />}
              checkedIcon={<CheckboxIconChecked width={15} height={15} />}
            />
            <ListItemText primary={option.label} primaryTypographyProps={{ fontSize: '11px' }} />
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
