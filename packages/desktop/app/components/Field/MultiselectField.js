import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import Select, { components } from 'react-select';
import styled from 'styled-components';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';
import { StyledTextField } from './TextField';
import { Colors } from '../../constants';

const StyledFormControl = styled(FormControl)`
  display: flex;
  flex-direction: column;

  // helper text
  .MuiFormHelperText-root {
    font-weight: 500;
    font-size: 12px;
    line-height: 15px;
    margin: 4px 2px 2px;
  }
`;

const StyledSelect = styled(props => <Select classNamePrefix="react-select" {...props} />)`
  .react-select__control {
    padding-right: 8px;
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
        fill={Colors.midText}
      />
    </StyledIndicator>
  </components.DropdownIndicator>
);

const MultiValueRemove = props => (
  <components.MultiValueRemove {...props}>
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7.85 0.15C7.65 -0.0499999 7.35 -0.0499999 7.15 0.15L4 3.3L0.85 0.15C0.65 -0.0499999 0.35 -0.0499999 0.15 0.15C-0.0499999 0.35 -0.0499999 0.65 0.15 0.85L3.3 4L0.15 7.15C-0.0499999 7.35 -0.0499999 7.65 0.15 7.85C0.25 7.95 0.35 8 0.5 8C0.65 8 0.75 7.95 0.85 7.85L4 4.7L7.15 7.85C7.25 7.95 7.4 8 7.5 8C7.6 8 7.75 7.95 7.85 7.85C8.05 7.65 8.05 7.35 7.85 7.15L4.7 4L7.85 0.85C8.05 0.65 8.05 0.35 7.85 0.15Z"
        fill={Colors.darkText}
      />
    </svg>
  </components.MultiValueRemove>
);

const getValues = value => {
  if (!value?.length) {
    return null;
  }

  return Array.isArray(value) ? value : value.split('; ');
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
      const newValue = selectedOptions.map(x => x.value).join('; ');
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
      <OuterLabelFieldWrapper label={label} {...props}>
        <StyledTextField
          value={valueText}
          variant="outlined"
          classes={classes}
          disabled={disabled}
          readOnly={isReadonly}
          {...props}
        />
      </OuterLabelFieldWrapper>
    );
  }

  return (
    <OuterLabelFieldWrapper label={label} {...props} ref={inputRef}>
      <StyledFormControl {...props}>
        <StyledSelect
          value={selected}
          isMulti
          $borderColor={props.error ? Colors.alert : null}
          onChange={handleChange}
          options={options}
          menuPlacement="auto"
          menuPosition="fixed"
          menuShouldBlockScroll="true"
          closeMenuOnSelect={false}
          hideSelectedOptions={false}
          components={{ DropdownIndicator, MultiValueRemove }}
          {...props}
        />
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </StyledFormControl>
    </OuterLabelFieldWrapper>
  );
};

export const MultiselectField = ({ field, ...props }) => (
  <MultiselectInput name={field.name} onChange={field.onChange} value={field.value} {...props} />
);

MultiselectInput.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.instanceOf(Object)),
  fullWidth: PropTypes.bool,
  form: PropTypes.shape({
    initialValues: PropTypes.shape({}),
  }),
};

MultiselectInput.defaultProps = {
  value: '',
  options: [],
  fullWidth: true,
  form: {
    initialValues: {},
  },
};
