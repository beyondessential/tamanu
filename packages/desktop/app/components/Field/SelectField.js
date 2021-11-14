import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import styled from 'styled-components';

import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';
import { StyledTextField } from './TextField';

export const SelectField = ({
  options,
  value,
  label,
  classes,
  disabled,
  readonly,
  onChange,
  name,
  form: { initialValues },
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

  const initialSelectedOption = options.find(option => value === option.value);

  const [selected, setSelected] = useState(initialSelectedOption);
  console.log(value, selected)
  useEffect(() => {
    if (!value) {
      setSelected(null);
    }
    console.log(value)
  }, [value]);

  const handleChange = useCallback(selectedOption => {
    setSelected(selectedOption);
    onChange({ target: { value: selectedOptions.value, name } });
  }, []);


  // support initial values
  useEffect(() => {
    const initialOption = options.find(o => o.value === initialValues[name]);
    setSelected(initialOption);
  }, []);

  return (
    <OuterLabelFieldWrapper label={label} {...props}>
      <Select
        value={selected}
        isMulti={multiselect}
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

SelectField.propTypes = {
  name: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(PropTypes.instanceOf(Object)),
  fullWidth: PropTypes.bool,
  multiselect: PropTypes.bool,
  form: PropTypes.shape({
    initialValues: PropTypes.shape({}),
  }),
};

SelectField.defaultProps = {
  value: '',
  options: [],
  fullWidth: true,
  multiselect: false,
  form: {
    initialValues: {},
  },
};
