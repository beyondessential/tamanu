import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Select, { components } from 'react-select';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import { Colors } from '../../constants';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';
import { StyledTextField } from './TextField';
import { Tag } from '../Tag';

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

const OptionContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const OptionTag = styled(Tag)`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: 25px;
`;

const SelectTag = styled(OptionTag)`
  right: 5px;
`;

const Option = props => {
  const tag = props.data?.tag;
  return (
    <OptionContainer>
      <components.Option {...props} />
      {tag && (
        <OptionTag $background={tag.background} $color={tag.color}>
          {tag.label}
        </OptionTag>
      )}
    </OptionContainer>
  );
};

const SingleValue = ({ children, ...props }) => {
  const tag = props.data?.tag;
  return (
    <components.SingleValue {...props} style={{ overflow: 'visible' }}>
      {children}
      {tag && (
        <SelectTag $background={tag.background} $color={tag.color}>
          {tag.label}
        </SelectTag>
      )}
    </components.SingleValue>
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
  ...props
}) => {
  const handleChange = useCallback(
    changedOption => {
      onChange({ target: { value: changedOption.value, name } });
    },
    [onChange, name],
  );

  const customStyles = {
    control: (provided, state) => {
      const mainBorderColor = state.isFocused ? Colors.primary : Colors.outline;
      const borderColor = props.error ? Colors.alert : mainBorderColor;
      return {
        ...provided,
        borderColor,
        boxShadow: 'none',
        borderRadius: '3px',
        paddingTop: '5px',
        paddingBottom: '3px',
        paddingLeft: '5px',
      };
    },
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
    singleValue: base => ({
      ...base,
      display: 'flex',
      width: '100%',
      overflow: 'visible',
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
    <OuterLabelFieldWrapper label={label} {...props}>
      <StyledFormControl {...props}>
        <Select
          value={selectedOption}
          onChange={handleChange}
          options={options}
          menuPlacement="auto"
          menuPosition="fixed"
          styles={customStyles}
          menuShouldBlockScroll="true"
          placeholder="Select"
          components={{ Option, SingleValue }}
          // menuIsOpen
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
