import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { components } from 'react-select';
import styled from 'styled-components';
import FormControl from '@material-ui/core/FormControl';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';
import { Colors } from '../../constants';
import { debounce } from 'lodash';
import { useTranslation } from '../../contexts/Translation';
import { FormHelperText } from '@material-ui/core';
import { SelectDropdownIndicator, SelectMultiValueRemove, Select } from '../Select';
import { CheckControl } from './CheckField';

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
  .react-select__value-container--is-multi {
    padding: 6px 0 6px 13px;
    &.react-select__value-container--has-value {
      padding-left: 4px;
    }
  }
  .react-select__placeholder {
    color: ${Colors.softText};
    line-height: 1;
    ${p => p.size === 'small' && 'font-size: 11px;'}
  }

  .react-select__multi-value {
    padding: 6px 11px;
    background-color: transparent;
    border-radius: 20px;
    border: 1px solid ${Colors.primary};
    max-width: 80%;
    margin: 0;
    margin-right: 4px;
  }
  .react-select__multi-value__label {
    font-size: 11px;
    line-height: 15px;
    padding: 0;
    white-space: pre-line;
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
    padding: 13px 15px;
    font-size: 13px;
    display: inline-flex;
    align-items: center;
    line-height: 1;
    ${p => p.size === 'small' && 'font-size: 11px; padding: 8px 12px 8px 20px;'}
    &:hover {
      background-color: ${Colors.background};
    }
    &--is-selected {
      background-color: unset;
      padding-left: 4px;
    }
  }

  .react-select__group {
    &:not(:last-child) {
      border-bottom: 1px solid ${Colors.outline};
    }
    padding: 0;
  }

  .react-select__group-heading {
    background-color: ${Colors.white};
    text-transform: none;
    font-size: 14px;
    color: ${Colors.darkestText};
    font-weight: 400;
    margin-bottom: 0;
    padding-left: 15px;
    padding-right: 15px;
  }
`;

const StyledTick = styled.svg`
  margin-right: 3px;
  margin-top: 2px;
  flex-shrink: 0;
`;

const GroupLabel = styled.div`
  padding-top: 8px;
  padding-bottom: 4px;
`;

const StyledCheckControl = styled(CheckControl)`
  padding: 0;
  margin-right: 6px;
  margin-left: ${props => (props.value ? '11px' : '0')};
  height: fit-content;
  i {
    margin: 0;
  }
`;

const ALL_OPTIONS_VALUE = 'ALL_OPTIONS';

const MultiValue = props => {
  const { getTranslation } = useTranslation();
  const {
    index,
    clearValue,
    removeProps,
    getValue,
    data,
    selectProps,
    isAllOptionsSelected,
    allowSelectAll,
  } = props;
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

  const children =
    isAllOptionsSelected && allowSelectAll
      ? getTranslation('general.multiAutocompleteField.allSelected', 'All selected')
      : selected.length === 1
      ? label
      : getTranslation('general.multiAutocompleteField.selected', ':items selected', {
          replacements: {
            items: selected.length,
          },
        });

  return (
    <components.MultiValue
      {...{
        ...props,
        children,
        removeProps: {
          ...removeProps,
          onClick: () => clearValue(),
        },
      }}
      data-testid="multivalue-5s3r"
    ></components.MultiValue>
  );
};

const Option = props => {
  const { isAllOptionsSelected, allowSelectAll, value, ...rest } = props;
  const isSelected =
    rest.isSelected || (value === ALL_OPTIONS_VALUE && isAllOptionsSelected && allowSelectAll);
  const children = (
    <>
      {allowSelectAll ? (
        <StyledCheckControl value={isSelected} />
      ) : (
        isSelected && (
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
        )
      )}
      <span>{props.children}</span>
    </>
  );
  return (
    <components.Option
      {...props}
      isFocused={false}
      isSelected={isSelected}
      data-testid="option-75zd"
    >
      {children}
    </components.Option>
  );
};

const Group = props => {
  return <components.Group {...props} />;
};

const GroupHeading = props => {
  return <components.GroupHeading {...props} />;
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
  allowSelectAll = false,
  ...props
}) => {
  const { getTranslation } = useTranslation();
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [selected, setSelected] = useState([]);

  const isAllOptionsSelected =
    options.length && options.every(option => selected.some(s => s.value === option.value));

  const groupedOptions = useMemo(() => {
    if (!allowSelectAll) return options;
    const selectedOptions = options.filter(option => selected.some(s => s.value === option.value));

    if (!options.length) return [];

    return [
      ...(selectedOptions.length && !isAllOptionsSelected
        ? [
            {
              label: (
                <GroupLabel>
                  {getTranslation(
                    'general.multiAutocompleteField.yourSelections',
                    'Your selections',
                  )}
                </GroupLabel>
              ),
              options: selectedOptions,
            },
          ]
        : []),
      {
        label: '',
        options: [
          {
            value: ALL_OPTIONS_VALUE,
            label: getTranslation('general.multiAutocompleteField.selectAll', 'Select all'),
          },
        ],
      },
      {
        label: '',
        options,
      },
    ];
  }, [options, selected, getTranslation, allowSelectAll, isAllOptionsSelected]);

  useEffect(() => {
    // fill initial values
    setSelected(currentSelected =>
      Array.isArray(value)
        ? value.map(v => ({ value: v, label: currentSelected.find(s => s.value === v)?.label }))
        : [],
    );
  }, [value]);

  useEffect(() => {
    handleLoadOption();
  }, []);

  const handleChange = useCallback(
    selectedOptions => {
      if (allowSelectAll && selectedOptions.some(s => s.value === ALL_OPTIONS_VALUE)) {
        if (isAllOptionsSelected) {
          setSelected([]);
          onChange({ target: { value: [], name } });
        } else {
          setSelected(options);
          onChange({ target: { value: options.map(x => x.value), name } });
        }
        return;
      }
      setSelected(selectedOptions);
      const newValue = selectedOptions.map(x => x.value);
      onChange({ target: { value: newValue, name } });
    },
    [options, onChange, name, allowSelectAll, isAllOptionsSelected],
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
    [suggester],
  );

  const handleInputChange = (value, { action }) => {
    if (action === 'menu-close') {
      return;
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
          options={groupedOptions}
          classNamePrefix="react-select"
          isMulti
          isOptionDisabled={() => {
            return !allowSelectAll && selected.length >= maxSelected;
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
            MultiValue: props => (
              <MultiValue
                {...props}
                isAllOptionsSelected={isAllOptionsSelected}
                allowSelectAll={allowSelectAll}
              />
            ),
            MultiValueRemove: SelectMultiValueRemove,
            Option: props => (
              <Option
                {...props}
                isAllOptionsSelected={isAllOptionsSelected}
                allowSelectAll={allowSelectAll}
              />
            ),
            Group,
            GroupHeading,
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
