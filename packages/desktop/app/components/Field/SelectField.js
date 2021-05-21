import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';

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
  multiselect,
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

  const [selected, setSelected] = useState();
  const handleChange = useCallback(selectedOptions => {
    setSelected(selectedOptions);
    const newValue = multiselect
      ? selectedOptions.map(x => x.value).join(', ')
      : selectedOptions.value;
    onChange({ target: { value: newValue, name } });
  }, []);

  // support initial values
  useEffect(() => {
    if (multiselect) {
      const initialOptionValues = initialValues[name]?.split(', ') || [];
      const initialOptions = options.filter(o => initialOptionValues.includes(o.value));
      setSelected(initialOptions);
    } else {
      const initialOption = options.find(o => o.value === initialValues[name]);
      setSelected(initialOption);
    }
  }, []);

  return (
    <OuterLabelFieldWrapper label={label} {...props}>
      <Select
        value={selected}
        isMulti={multiselect}
        onChange={handleChange}
        options={options}
        {...props}
      />
    </OuterLabelFieldWrapper>
  );
};

export const SelectField = ({ field, ...props }) => (
  <SelectInput name={field.name} onChange={field.onChange} {...props} />
);

export const MultiselectField = ({ field, ...props }) => (
  <SelectInput multiselect name={field.name} onChange={field.onChange} {...props} />
);

SelectInput.propTypes = {
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

SelectInput.defaultProps = {
  value: '',
  options: [],
  fullWidth: true,
  multiselect: false,
  form: {
    initialValues: {},
  },
};
