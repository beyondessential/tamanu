import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';
import { Colors } from '../../constants';

const StyledFormControl = styled(FormControl)`
  display: flex;
  flex-direction: column;
`;

const StyledRadioGroup = styled(RadioGroup)`
  display: grid;
  grid-auto-flow: ${props => (props.row ? 'row' : 'column')};
  grid-template-columns: ${props => `repeat(${props.length}, 1fr)`};
`;

const StyledRadio = styled(Radio)`
  svg {
    color: ${props => {
      if (props.theme) {
        if (props.value === props.selected) return Colors.white;
        return props.theme;
      }

      if (props.value === props.selected) return Colors.primary;
      else return '#cccccc';
    }};
  }
`;

const ControlLabel = styled(FormControlLabel)`
  margin: 0;
  padding: 15px 4px;
  border: 1px solid rgba(0, 0, 0, 0.23);
  justify-content: center;
  background: ${props => {
    if (props.theme) {
      if (props.value === props.selected) return props.theme;
      return Colors.white;
    }

    if (props.value === props.selected) return '#fafafa';
    else return Colors.white;
  }};

  span {
    font-size: 1rem;
    padding: 0.5px 3px 0 0;
  }

  span:last-of-type {
    color: ${props => {
      if (props.theme) {
        if (props.value === props.selected) return Colors.white;
        return props.theme;
      }

      if (props.value === props.selected) return Colors.darkText;
      else return Colors.midText;
    }};
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
  inline = false,
  style,
  ...props
}) => (
  <OuterLabelFieldWrapper label={label} {...props}>
    <StyledFormControl style={style} {...props}>
      <StyledRadioGroup
        length={options.length}
        row={inline}
        aria-label={name}
        name={name}
        value={value || ''}
        {...props}
      >
        {options.map(option => (
          <ControlLabel
            key={option.value}
            control={<StyledRadio theme={option.theme} value={option.value} selected={value} />}
            label={option.label}
            value={option.value}
            selected={value}
            theme={option.theme}
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
