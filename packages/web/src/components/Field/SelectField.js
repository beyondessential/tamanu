import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import styled from 'styled-components';
import { Colors } from '../../constants';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';
import { StyledTextField } from './TextField';

export const SelectInput = ({
  options,
  value,
  label,
  classes,
  disabled,
  readonly,
  onChange,
  name,
  ...props
}) => {
  const handleChange = useCallback(
    changedOption => {
      onChange({ target: { value: changedOption.value, name } });
    },
    [onChange, name],
  );

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? Colors.primary : Colors.outline,
      boxShadow: 'none',
      borderRadius: '3px',
      paddingTop: '5px',
      paddingBottom: '3px',
      paddingLeft: '5px',
    }),
    dropdownIndicator: provided => ({
      ...provided,
      color: Colors.midText,
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
          {...props}
        />
      </OuterLabelFieldWrapper>
    );
  }

  const selectedOption = options.find(option => value === option.value) ?? '';

  return (
    <OuterLabelFieldWrapper label={label} {...props}>
      <Select
        value={selectedOption}
        onChange={handleChange}
        options={options}
        menuPlacement="auto"
        menuPosition="fixed"
        styles={customStyles}
        menuShouldBlockScroll="true"
        placeholder="Select"
        {...props}
      />
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
