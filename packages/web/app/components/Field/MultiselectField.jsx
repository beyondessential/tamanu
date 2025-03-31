import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { createFilter } from 'react-select';
import styled from 'styled-components';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';
import { StyledTextField } from './TextField';
import { Colors } from '../../constants';
import { Icon, ExpandMoreIcon } from './FieldCommonComponents';
import { TranslatedEnumField } from '../Translation/TranslatedEnumIInput';
import { Select, SelectDropdownIndicator, SelectMultiValueRemove } from '../Select';

const StyledFormControl = styled(FormControl)`
  display: flex;
  flex-direction: column;

  // helper text
  .MuiFormHelperText-root {
    font-weight: 500;
    font-size: 11px;
    line-height: 15px;
    margin: 4px 2px 2px;
  }
`;

const StyledSelect = styled(props => <Select classNamePrefix="react-select" {...props} data-testid='select-zra3' />)`
  .react-select__control {
    padding-right: 8px;
    min-height: 44px;
    ${props => (props.$borderColor ? `border: 1px solid ${props.$borderColor};` : '')}
    &:hover {
      border: 1px solid ${Colors.primary};
    }
  }
  .react-select__control--is-focused {
    border: 1px solid ${Colors.primary};
    box-shadow: none;
  }
  .react-select__clear-indicator {
    display: none;
  }
  .react-select__indicator-separator {
    display: none;
  }
  .react-select__menu {
    border: 1px solid ${Colors.primary};
    overflow: overlay;
  }
  .react-select__option {
    color: ${Colors.darkestText};
    cursor: pointer;
    &:active {
      background-color: ${Colors.background};
    }
  }
  .react-select__option--is-selected {
    background-color: ${Colors.background};
    color: ${Colors.darkestText};
    &:active {
      background-color: transparent;
    }
  }
  .react-select__option--is-focused {
    background-color: ${Colors.background};
    color: ${Colors.darkestText};
  }
  .react-select__multi-value {
    padding: 3px;
    background-color: transparent;
    border-radius: 50px;
    border: 1px solid ${Colors.primary};
    max-width: 150px;
  }
  .react-select__multi-value-label {
    color: ${Colors.darkestText};
  }
  .react-select__multi-value__remove {
    color: ${Colors.darkText};
    &:hover {
      background-color: transparent;
      color: ${Colors.darkText};
      cursor: pointer;
    }
  }
`;

const getValues = value => {
  if (!value?.length) {
    return null;
  }

  return Array.isArray(value) ? value : JSON.parse(value);
};

const getSearchBy = option => {
  if (option.data.searchString) return option.data.searchString;
  if (typeof option.label === 'string') return option.label;

  return option.value;
};

export const MultiselectInput = ({
  options,
  value,
  label,
  classes,
  disabled,
  readonly,
  onChange,
  name,
  helperText,
  inputRef,
  form: { initialValues },
  ...props
}) => {
  // If value is already set, keep that value, otherwise attempt to load any initial values
  const values = getValues(value) || getValues(initialValues[name]) || [];

  const initialSelectedOptions = options.filter(option => values.includes(option.value));

  const [selected, setSelected] = useState(initialSelectedOptions);
  const handleChange = useCallback(
    selectedOptions => {
      setSelected(selectedOptions);
      const newValue = JSON.stringify(selectedOptions.map(x => x.value));
      onChange({ target: { value: newValue, name } });
    },
    [onChange, name],
  );

  useEffect(() => {
    const newValues = getValues(value) || [];
    const newOptions = options.filter(option => newValues.includes(option.value));
    setSelected(newOptions);
  }, [value, options]);

  const isReadonly = (readonly && !disabled) || (value && !onChange);
  if (disabled || isReadonly || !options || options.length === 0) {
    const valueText = ((options || []).find(o => o.value === value) || {}).label || '';
    return (
      <OuterLabelFieldWrapper label={label} {...props} data-testid='outerlabelfieldwrapper-icpi'>
        <StyledTextField
          value={valueText}
          variant="outlined"
          classes={classes}
          disabled={disabled}
          readOnly={isReadonly}
          InputProps={{
            endAdornment: (
              <Icon position="end" data-testid='icon-ogzj'>
                <ExpandMoreIcon data-testid='expandmoreicon-knh6' />
              </Icon>
            ),
          }}
          {...props}
          data-testid='styledtextfield-0amg' />
      </OuterLabelFieldWrapper>
    );
  }

  return (
    <OuterLabelFieldWrapper
      label={label}
      {...props}
      ref={inputRef}
      data-testid='outerlabelfieldwrapper-ui01'>
      <StyledFormControl {...props} data-testid='styledformcontrol-lc84'>
        <StyledSelect
          value={selected}
          isMulti
          disabled
          $borderColor={props.error ? Colors.alert : null}
          $minHeight="43px"
          $borderRadius="3px"
          onChange={handleChange}
          options={options}
          menuPlacement="auto"
          menuPosition="fixed"
          menuShouldBlockScroll="true"
          closeMenuOnSelect={false}
          hideSelectedOptions={false}
          filterOption={createFilter({
            matchFrom: 'any',
            stringify: getSearchBy,
          })}
          components={{
            DropdownIndicator: SelectDropdownIndicator,
            MultiValueRemove: SelectMultiValueRemove,
          }}
          {...props}
          data-testid='styledselect-usf8' />
        {helperText && <FormHelperText data-testid='formhelpertext-s80c'>{helperText}</FormHelperText>}
      </StyledFormControl>
    </OuterLabelFieldWrapper>
  );
};

export const BaseMultiselectField = ({ field, ...props }) => (
  <MultiselectInput
    name={field.name}
    onChange={field.onChange}
    value={field.value}
    {...props}
    data-testid='multiselectinput-cxdw' />
);

export const TranslatedMultiSelectField = props => {
  return (
    <TranslatedEnumField
      {...props}
      component={MultiselectInput}
      data-testid='translatedenumfield-oi43' />
  );
};

MultiselectInput.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.instanceOf(Object)),
  fullWidth: PropTypes.bool,
  form: PropTypes.shape({
    initialValues: PropTypes.shape({}),
  }),
};

MultiselectInput.defaultProps = {
  value: [],
  options: [],
  fullWidth: true,
  form: {
    initialValues: {},
  },
};

export const MultiselectField = ({ field, value, name, ...props }) => (
  <MultiselectInput
    value={field ? field.value : value}
    name={field ? field.name : name}
    {...props}
    data-testid='multiselectinput-dvij' />
);

MultiselectField.propTypes = {
  options: PropTypes.array.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.any.isRequired,
  prefix: PropTypes.string,
};
