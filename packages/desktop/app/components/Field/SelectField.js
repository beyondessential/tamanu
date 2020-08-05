import React from 'react';
import MuiMenuItem from '@material-ui/core/MenuItem';
import PropTypes from 'prop-types';
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
  ...props
}) => {
  const isReadonly = readonly || (value && !onChange);
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
      <StyledTextField
        select
        value={value || ''}
        onChange={onChange}
        variant="outlined"
        classes={classes}
        {...props}
      >
        {options.map(o => (
          <MuiMenuItem key={o.value} value={o.value}>
            {o.label}
          </MuiMenuItem>
        ))}
      </StyledTextField>
    </OuterLabelFieldWrapper>
  );
};

export const SelectField = ({ field, ...props }) => (
  <SelectInput name={field.name} value={field.value || ''} onChange={field.onChange} {...props} />
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
};
