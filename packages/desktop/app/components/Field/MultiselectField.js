import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';

import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';
import { StyledTextField } from './TextField';

export const MultiselectInput = ({
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
  // If value is already set, keep that value, otherwise attempt to load any initial values
  const values = value ? value.split(', ') : initialValues[name]?.split(', ') || [];
  const initialSelectedOptions = options.filter(option => values.includes(option.value));

  const [selected, setSelected] = useState(initialSelectedOptions);
  const handleChange = useCallback(
    selectedOptions => {
      setSelected(selectedOptions);
      const newValue = selectedOptions.map(x => x.value).join(', ');
      onChange({ target: { value: newValue, name } });
    },
    [onChange, name],
  );

  useEffect(() => {
    const newValues = value ? value.split(', ') : [];
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
    <OuterLabelFieldWrapper label={label} {...props}>
      <Select
        value={selected}
        isMulti
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
