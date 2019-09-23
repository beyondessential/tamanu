import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';

const StyledFormControl = styled(FormControl)`
  display: flex;
  flex-direction: column;
`;

const StyledRadioGroup = styled(RadioGroup)`
  flex-direction: ${props => (props.inline ? 'row' : 'column')};
  flex-wrap: nowrap;
`;

const StyledRadio = styled(Radio)`
  svg {
    color: ${props => (props.value === props.selected ? '#4285F4' : '#cccccc')};
  }
`;

const ControlLabel = styled(FormControlLabel)`
  background: ${props => (props.value === props.selected ? '#fafafa' : '#fff')};
  margin: 0;
  padding: 15px 4px;
  border: 1px solid rgba(0, 0, 0, 0.23);

  span {
    font-size: 1rem;
    padding: 0.5px 3px 0 0;
  }

  span:last-of-type {
    color: ${props => (props.value === props.selected ? '#666666' : '#999999')};
  }

  :not(:last-of-type) {
    border-right: none;
  }

  :first-of-type {
    border-radius: 3px 0 0 3px;
  }

  :last-of-type {
    border-radius: 0 3px 3px 0;
  }
`;

export const RadioInput = ({
  options,
  name,
  value,
  label,
  helperText,
  inline,
  style,
  ...props
}) => (
  <OuterLabelFieldWrapper label={label} {...props}>
    <StyledFormControl style={style} {...props}>
      <StyledRadioGroup
        inline={inline}
        aria-label={name}
        name={name}
        value={value || ''}
        {...props}
      >
        {options.map(option => (
          <ControlLabel
            key={option.value}
            control={<StyledRadio value={option.value} selected={value} />}
            label={option.label}
            value={option.value}
            selected={value}
          />
        ))}
      </StyledRadioGroup>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </StyledFormControl>
  </OuterLabelFieldWrapper>
);

export const RadioField = ({ field, error, ...props }) => (
  <RadioInput
    name={field.name}
    value={field.value || ''}
    onChange={field.onChange}
    error={error || undefined}
    {...props}
  />
);

RadioInput.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.instanceOf(Object)).isRequired,
  inline: PropTypes.bool, // display radio options in single line
};

RadioInput.defaultProps = {
  value: false,
  inline: false,
};
