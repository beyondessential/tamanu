import React, { useCallback, useEffect, useState } from 'react';
import Select, { components } from 'react-select';
import styled from 'styled-components';
import FormControl from '@material-ui/core/FormControl';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';
import { Colors } from '../../constants';
import { debounce } from 'lodash';
import { useTranslation } from '../../contexts/Translation';
import { FormHelperText } from '@material-ui/core';

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
    border-color: ${props => props.$borderColor || Colors.outline};
    border-radius: 3px;
  }
  .react-select__control--is-focused {
    border-color: ${Colors.primary};
    box-shadow: none;
    &:hover {
      border-color: ${Colors.primary};
    }
  }
  .react-select__clear-indicator {
    display: none;
  }
  .react-select__indicator-separator {
    display: none;
  }
  .react-select__value-container--is-multi {
    padding: 4px 0 4px 13px;
    &.react-select__value-container--has-value {
      padding-left: 4px;
    }
  }
  .react-select__placeholder {
    color: ${Colors.softText};
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
    &:hover {
      background-color: ${Colors.background};
    }
    &--is-selected {
      background-color: unset;
      padding-left: 4px;
    }
  }

  /* This does not seem to be working on electron (although it works on Chrome) */
  /* Scrollbar styling (for windows) */
  /* scrollbar total width */
  .react-select__menu::-webkit-scrollbar {
    background-color: rgba(0, 0, 0, 0);
    width: 16px;
    height: 16px;
    z-index: 999999;
  }
  /* background of the scrollbar except button or resizer */
  .react-select__menu::-webkit-scrollbar-track {
    background-color: rgba(0, 0, 0, 0);
  }
  /* scrollbar itself */
  .react-select__menu::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0);
    border-radius: 16px;
    border: 0px solid #fff;
  }
  /* set button(top and bottom of the scrollbar) */
  .react-select__menu::-webkit-scrollbar-button {
    display: none;
  }
  /* scrollbar when element is hovered */
  .react-select__menu:hover::-webkit-scrollbar-thumb {
    background-color: #a0a0a5;
    border: 4px solid #fff;
  }
  /* scrollbar when scrollbar is hovered */
  .react-select__menu::-webkit-scrollbar-thumb:hover {
    background-color: #a0a0a5;
    border: 4px solid #f4f4f4;
  }
`;

const StyledIndicator = styled.svg`
  ${props => (props.$focused ? '' : 'transform: rotate(180deg);')}
`;

const StyledTick = styled.svg`
  margin-right: 3px;
  margin-top: 6px;
  flex-shrink: 0;
`;

const DropdownIndicator = props => (
  <components.DropdownIndicator {...props}>
    <StyledIndicator
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      $focused={props?.isFocused}
    >
      <path
        d="M5.00008 0.144765C5.15633 0.144765 5.30602 0.207578 5.41633 0.320077L9.8282 4.79445C10.0573 5.02758 10.0573 5.40477 9.8282 5.63758C9.59852 5.87039 9.22477 5.87039 8.99633 5.63758L5.00008 1.58445L1.00477 5.63789C0.774766 5.8707 0.401641 5.8707 0.172266 5.63789C-0.0571088 5.40539 -0.0571088 5.02758 0.172266 4.79445L4.58383 0.319452C4.69477 0.207577 4.84445 0.144765 5.00008 0.144765Z"
        fill={Colors.darkText}
      />
    </StyledIndicator>
  </components.DropdownIndicator>
);

const MultiValueRemove = props => {
  return (
    <components.MultiValueRemove {...props}>
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M7.85 0.15C7.65 -0.0499999 7.35 -0.0499999 7.15 0.15L4 3.3L0.85 0.15C0.65 -0.0499999 0.35 -0.0499999 0.15 0.15C-0.0499999 0.35 -0.0499999 0.65 0.15 0.85L3.3 4L0.15 7.15C-0.0499999 7.35 -0.0499999 7.65 0.15 7.85C0.25 7.95 0.35 8 0.5 8C0.65 8 0.75 7.95 0.85 7.85L4 4.7L7.15 7.85C7.25 7.95 7.4 8 7.5 8C7.6 8 7.75 7.95 7.85 7.85C8.05 7.65 8.05 7.35 7.85 7.15L4.7 4L7.85 0.85C8.05 0.65 8.05 0.35 7.85 0.15Z"
          fill={Colors.darkText}
        />
      </svg>
    </components.MultiValueRemove>
  );
};

const MultiValue = props => {
  const { getTranslation } = useTranslation();
  const { index, clearValue, removeProps, getValue, data, selectProps } = props;
  const selected = getValue();
  const [label, setLabel] = useState(data?.label);

  useEffect(() => {
    if (index === 0 && data?.value && !data.label) {
      selectProps.fetchCurrentOption(data.value).then(option => {
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
                items: selected.length,
              }),
        removeProps: {
          ...removeProps,
          onClick: () => clearValue(),
        },
      }}
    ></components.MultiValue>
  );
};

const Option = props => {
  const children = (
    <>
      {props.isSelected && (
        <StyledTick
          width="8"
          height="6"
          viewBox="0 0 8 6"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
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
    <components.Option {...props} isFocused={false}>
      {children}
    </components.Option>
  );
};

const MultiAutocompleteInput = ({
  value,
  label,
  disabled,
  onChange,
  name,
  suggester,
  placeholder,
  helperText,
  ...props
}) => {
  const { getTranslation } = useTranslation();
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    // fill initial values
    setSelected(
      value?.map(v => ({ value: v, label: selected.find(s => s.value === v)?.label })) || [],
    );
  }, [value]);

  const handleChange = useCallback(
    selectedOptions => {
      setSelected(selectedOptions);
      const newValue = selectedOptions.map(x => x.value);
      onChange({ target: { value: newValue, name } });
    },
    [onChange, name],
  );

  const handleLoadOption = useCallback(
    debounce(async search => {
      try {
        const options = await suggester.fetchSuggestions(search);
        setOptions(options);
      } catch {
        setOptions([]);
      }
    }, 200),
    [],
  );

  const handleInputChange = (value, { action }) => {
    if (action !== 'input-change') return;
    setInputValue(value);
    handleLoadOption(value);
  };

  return (
    <OuterLabelFieldWrapper label={label} {...props}>
      <StyledFormControl {...props}>
        <StyledSelect
          value={selected}
          options={options}
          classNamePrefix="react-select"
          isMulti
          $borderColor={props.error ? Colors.alert : null}
          closeMenuOnSelect={false}
          hideSelectedOptions={false}
          tabSelectsValue={false}
          backspaceRemovesValue={false}
          noOptionsMessage={() => null}
          placeholder={placeholder ?? getTranslation('general.placeholder.search...', 'Search...')}
          inputValue={inputValue}
          filterOption={null} // filter by suggester
          components={{
            DropdownIndicator,
            MultiValue,
            MultiValueRemove,
            Option,
          }}
          onChange={handleChange}
          onMenuOpen={() => handleLoadOption(inputValue)}
          onInputChange={handleInputChange}
          fetchCurrentOption={suggester.fetchCurrentOption}
          isDisabled={disabled}
          {...props}
        />
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
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
