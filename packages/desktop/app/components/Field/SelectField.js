import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import styled from 'styled-components';

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

  const selectedOption = options.find(option => value === option.value) ?? '';

  const handleChange = useCallback(selectedOption => {
    onChange({ target: { value: selectedOption.value, name } });
  }, []);

  return (
    <OuterLabelFieldWrapper label={label} {...props}>
      <Select
        value={selectedOption}
        onChange={handleChange}
        options={options}
        menuPlacement="auto"
        menuPosition="fixed"
        menuShouldBlockScroll="true"
        {...props}
      />
    </OuterLabelFieldWrapper>
  );
};

export const SelectField = ({ field, ...props }) => (
  <SelectInput
    name={field.name}
    onChange={field.onChange}
    value={field.value}
    {...props}
  />
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
export const StyledSelectField = styled(SelectField)`
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
};
