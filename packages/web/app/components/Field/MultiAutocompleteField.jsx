import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { components } from 'react-select';
import styled from 'styled-components';
import FormControl from '@material-ui/core/FormControl';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';
import { Colors } from '../../constants';
import { debounce } from 'lodash';
import { useTranslation } from '../../contexts/Translation';
import { FormHelperText } from '@material-ui/core';
import { SelectDropdownIndicator, SelectMultiValueRemove, Select } from '../Select';

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

const StyledSelect = styled(Select)`
  .react-select__control {
    padding-right: 8px;
    min-height: 39px;
    border-color: ${(props) => props.$borderColor || Colors.outline};
    border-radius: 3px;
  }
  .react-select__control--is-focused {
    border-color: ${Colors.primary};
    box-shadow: none;
    &:hover {
      border-color: ${Colors.primary};
    }
  }
  .react-select__value-container--is-multi {
    padding: 4px 0 4px 13px;
    &.react-select__value-container--has-value {
      padding-left: 4px;
    }
  }
  .react-select__placeholder {
    color: ${Colors.softText};
    ${(p) => p.size === 'small' && 'font-size: 11px;'}
  }

  .react-select__multi-value {
    padding: 6px 11px;
    background-color: transparent;
    border-radius: 50px;
    border: 1px solid ${Colors.primary};
    max-width: 80%;
    margin: 0;
    margin-right: 4px;
  }
  .react-select__multi-value__label {
    font-size: 11px;
    line-height: 15px;
    padding: 0;
  }
  .react-select__multi-value__remove {
    cursor: pointer;
    padding-right: 0;
    padding-left: 10px;
    &:hover {
      background-color: transparent;
    }
  }

  .react-select__menu {
    border: 1px solid ${Colors.primary};
    border-radius: 3px;
    overflow: overlay;
    box-shadow: none;
    margin: 1px 0;
  }
  .react-select__menu-list {
    padding: 0;
    max-height: 190px;
  }
  .react-select__option {
    color: ${Colors.darkestText};
    cursor: pointer;
    padding: 10px 15px;
    font-size: 13px;
    display: inline-flex;
    ${(p) => p.size === 'small' && 'font-size: 11px; padding: 8px 12px 8px 20px;'}
    &:hover {
      background-color: ${Colors.background};
    }
    &--is-selected {
      background-color: unset;
      padding-left: 4px;
    }
  }
`;

const StyledTick = styled.svg`
  margin-right: 3px;
  margin-top: 6px;
  flex-shrink: 0;
`;

const MultiValue = (props) => {
  const { getTranslation } = useTranslation();
  const { index, clearValue, removeProps, getValue, data, selectProps } = props;
  const selected = getValue();
  const [label, setLabel] = useState(data?.label);

  useEffect(() => {
    if (index === 0 && data?.value && !data.label) {
      selectProps.fetchCurrentOption(data.value).then((option) => {
        setLabel(option.label);
      });
    }
  }, [data?.value, index]);

  if (index !== 0) return null;

  return (
    <components.MultiValue
      {...{
        ...props,
        children:
          selected.length === 1
            ? label
            : getTranslation('general.multiAutocompleteField.selected', ':items selected', {
                replacements: {
                  items: selected.length,
                },
              }),
        removeProps: {
          ...removeProps,
          onClick: () => clearValue(),
        },
      }}
      data-testid="multivalue-5s3r"
    ></components.MultiValue>
  );
};

const Option = (props) => {
  const children = (
    <>
      {props.isSelected && (
        <StyledTick
          width="8"
          height="6"
          viewBox="0 0 8 6"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          data-testid="styledtick-ror3"
        >
          <path
            d="M7.82857 1.02L3.25714 5.82C3.14286 5.94 3.02857 6 2.85714 6C2.68571 6 2.57143 5.94 2.45714 5.82L0.171429 3.42C-0.0571429 3.18 -0.0571429 2.82 0.171429 2.58C0.4 2.34 0.742857 2.34 0.971428 2.58L2.85714 4.56L7.02857 0.18C7.25714 -0.06 7.6 -0.06 7.82857 0.18C8.05714 0.42 8.05714 0.78 7.82857 1.02Z"
            fill={Colors.primary}
          />
        </StyledTick>
      )}
      <span>{props.children}</span>
    </>
  );
  return (
    <components.Option {...props} isFocused={false} data-testid="option-75zd">
      {children}
    </components.Option>
  );
};

export const MultiAutocompleteInput = ({
  value,
  label,
  disabled,
  onChange,
  name,
  suggester,
  placeholder,
  helperText,
  maxSelected = 10,
  ...props
}) => {
  const { getTranslation } = useTranslation();
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    // fill initial values
    setSelected(
      Array.isArray(value)
        ? value.map((v) => ({ value: v, label: selected.find((s) => s.value === v)?.label }))
        : [],
    );
  }, [value]);

  const handleChange = useCallback(
    (selectedOptions) => {
      setSelected(selectedOptions);
      const newValue = selectedOptions.map((x) => x.value);
      onChange({ target: { value: newValue, name } });
    },
    [onChange, name],
  );

  const handleLoadOption = useMemo(
    () =>
      debounce(async search => {
        try {
          const options = await suggester.fetchSuggestions(search);
          setOptions(options);
        } catch {
          setOptions([]);
        }
      }, 200),
    [suggester],
  );

  const handleInputChange = (value, { action }) => {
    if (action === 'menu-close') {
      return setOptions([]);
    }
    if (action !== 'input-change' && action !== 'set-value') return;
    setInputValue(value);
    handleLoadOption(value);
  };

  return (
    <OuterLabelFieldWrapper label={label} {...props} data-testid="outerlabelfieldwrapper-cqwo">
      <StyledFormControl {...props} data-testid="styledformcontrol-td30">
        <StyledSelect
          value={selected}
          options={options}
          classNamePrefix="react-select"
          isMulti
          isOptionDisabled={() => {
            return selected.length >= maxSelected;
          }}
          $borderColor={props.error ? Colors.alert : null}
          closeMenuOnSelect={false}
          hideSelectedOptions={false}
          tabSelectsValue={false}
          backspaceRemovesValue={false}
          noOptionsMessage={() => null}
          placeholder={placeholder ?? getTranslation('general.placeholder.search...', 'Search...')}
          inputValue={inputValue}
          // filter by suggester
          filterOption={null}
          components={{
            DropdownIndicator: SelectDropdownIndicator,
            MultiValue,
            MultiValueRemove: SelectMultiValueRemove,
            Option,
          }}
          onChange={handleChange}
          onMenuOpen={() => handleLoadOption(inputValue)}
          onInputChange={handleInputChange}
          fetchCurrentOption={suggester.fetchCurrentOption}
          isDisabled={disabled}
          {...props}
        />
        {helperText && (
          <FormHelperText data-testid="formhelpertext-5maz">{helperText}</FormHelperText>
        )}
      </StyledFormControl>
    </OuterLabelFieldWrapper>
  );
};

export const MultiAutocompleteField = ({ field, ...props }) => (
  <MultiAutocompleteInput
    value={field.value}
    name={field.name}
    onChange={field.onChange}
    {...props}
  />
);
