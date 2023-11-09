import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Select, { components } from 'react-select';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import { IconButton } from '@material-ui/core';
import { ClearIcon } from '../Icons/ClearIcon';
import { ChevronIcon } from '../Icons/ChevronIcon';
import { Colors } from '../../constants';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';
import { StyledTextField } from './TextField';
import { FormFieldTag } from '../Tag';

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

const SelectTag = styled(FormFieldTag)`
  right: 5px;
`;

const OptionTag = styled(FormFieldTag)`
  right: 20px;
`;

const StyledIconButton = styled(IconButton)`
  padding: 5px;
  position: absolute;
  right: 35px;
`;

const StyledClearIcon = styled(ClearIcon)`
  cursor: pointer;
  color: ${Colors.darkText};
`;

const StyledChevronIcon = styled(ChevronIcon)`
  margin-left: 4px;
  margin-right: 20px;
`;

const Option = ({ children, ...props }) => {
  const tag = props.data?.tag;
  return (
    <components.Option {...props}>
      {children}
      {tag && (
        <OptionTag $background={tag.background} $color={tag.color}>
          {tag.label}
        </OptionTag>
      )}
    </components.Option>
  );
};

const SingleValue = ({ children, ...props }) => {
  const tag = props.data?.tag;
  return (
    <components.SingleValue {...props}>
      {children}
      {tag && (
        <SelectTag $background={tag.background} $color={tag.color}>
          {tag.label}
        </SelectTag>
      )}
    </components.SingleValue>
  );
};

const ClearIndicator = ({ innerProps, tabIndex = 0 }) => {
  return (
    <StyledIconButton {...innerProps} tabIndex={tabIndex}>
      <StyledClearIcon />
    </StyledIconButton>
  );
};

export const SelectInput = ({
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
  form,
  tabIndex,
  inputProps = {},
  isClearable = true,
  ...props
}) => {
  const handleChange = useCallback(
    changedOption => {
      const userClickedClear = !changedOption;
      if (userClickedClear) {
        onChange({ target: { value: undefined, name } });
        return;
      }
      onChange({ target: { value: changedOption.value, name } });
    },
    [onChange, name],
  );

  const customStyles = {
    control: (provided, state) => {
      const mainBorderColor = state.isFocused ? Colors.primary : Colors.outline;
      const borderColor = props.error ? Colors.alert : mainBorderColor;
      const fontSize = props.size === 'small' ? '11px' : '15px';
      return {
        ...provided,
        borderColor,
        boxShadow: 'none',
        borderRadius: '3px',
        paddingTop: '11px',
        paddingBottom: '9px',
        paddingLeft: '5px',
        fontSize,
      };
    },
    dropdownIndicator: provided => ({
      ...provided,
      padding: '4px 16px 6px 6px',
    }),
    placeholder: provided => ({ ...provided, color: Colors.softText }),
    indicatorSeparator: () => ({ display: 'none' }),
    menu: provided => ({
      ...provided,
      marginTop: 0,
      marginBottom: 0,
      boxShadow: 'none',
      border: `1px solid ${Colors.outline}`,
    }),
    option: (provided, state) => {
      const fontSize = props.size === 'small' ? '11px' : '14px';
      return {
        ...provided,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: state.isFocused || state.isSelected ? Colors.hoverGrey : Colors.white,
        ...(state.isDisabled ? {} : { color: Colors.darkestText }),
        cursor: 'pointer',
        fontSize,
      };
    },
    singleValue: base => ({
      ...base,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      overflow: 'visible',
      cursor: 'text',
      color: Colors.darkestText,
    }),
  };

  const isReadonly = (readonly && !disabled) || (value && !onChange);
  if (disabled || isReadonly || !options || options.length === 0) {
    const valueText = ((options || []).find(o => o.value === value) || {}).label || '';
    return (
      <OuterLabelFieldWrapper label={label} {...props}>
        <StyledTextField
          value={valueText}
          styles={customStyles}
          variant="outlined"
          classes={classes}
          disabled={disabled}
          readOnly={isReadonly}
          components={{ Option, SingleValue }}
          {...props}
        />
      </OuterLabelFieldWrapper>
    );
  }

  const selectedOption = options.find(option => value === option.value) ?? '';

  return (
    <OuterLabelFieldWrapper label={label} ref={inputRef} {...props}>
      <StyledFormControl {...props}>
        <Select
          value={selectedOption}
          onChange={handleChange}
          options={options.filter(option => option.value !== '')}
          menuPlacement="auto"
          menuPosition="fixed"
          styles={customStyles}
          menuShouldBlockScroll="true"
          placeholder="Select"
          isClearable={value !== '' && isClearable && !props.required && !disabled}
          isSearchable={false}
          tabIndex={inputProps.tabIndex}
          components={{
            Option,
            SingleValue,
            ClearIndicator: innerProps => (
              <ClearIndicator {...innerProps} tabIndex={inputProps.tabIndex} />
            ),
            DropdownIndicator: StyledChevronIcon,
          }}
          {...props}
        />
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </StyledFormControl>
    </OuterLabelFieldWrapper>
  );
};

export const SelectField = ({ field, ...props }) => (
  <SelectInput name={field.name} onChange={field.onChange} value={field.value} {...props} />
);

/*
  To be able to actually apply the styles, the component
  that uses StyledSelectField needs to add the following
  attributes:

  className="styled-select-container"
  classNamePrefix="styled-select"

  The reason is because it's inheriting from the Select
  component from react-select.
*/
const StyledField = styled(SelectField)`
  .styled-select-container {
    padding: 8px 8px 2px 8px;
    border: 1px solid #dedede;
    border-right: none;
  }

  .styled-select__control,
  .styled-select__control--is-focused,
  .styled-select__control--menu-is-open {
    border: none;
    box-shadow: none;
  }
`;

export const StyledSelectField = props => (
  <StyledField {...props} className="styled-select-container" classNamePrefix="styled-select" />
);

SelectInput.propTypes = {
  name: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(PropTypes.instanceOf(Object)),
  fullWidth: PropTypes.bool,
};

SelectInput.defaultProps = {
  value: '',
  options: [],
  fullWidth: true,
  name: null,
  onChange: null,
};
