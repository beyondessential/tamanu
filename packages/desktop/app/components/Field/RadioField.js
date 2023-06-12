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

const DEFAULT_LABEL_THEME = {
  color: { default: Colors.outline, selected: Colors.primary },
  background: { default: Colors.white, selected: Colors.offWhite },
  border: { default: Colors.outline, selected: Colors.primary },
  text: { default: Colors.darkText, selected: Colors.darkestText },
};

const StyledFormControl = styled(FormControl)`
  display: flex;
  flex-direction: column;
`;

const StyledRadioGroup = styled(RadioGroup)`
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  flex-direction: row;
`;

const ControlLabel = styled(FormControlLabel)`
  flex: ${props => props.$fullWidth && 1};
  margin: 0 10px 0 0;
  border-radius: 3px;
  padding: 12px 20px;
  border: 1px solid
    ${props => (props.selected ? props.theme.border.selected : props.theme.border.default)};
  justify-content: center;
  background: ${props =>
    props.selected ? props.theme.background.selected : props.theme.background.default};

  &:last-child {
    margin-right: 0;
  }

  .MuiButtonBase-root {
    padding: 0;
    margin-left: -5px;
    color: ${props => (props.selected ? props.theme.color.selected : props.theme.color.default)};

    svg {
      font-size: 18px;
    }
  }

  .MuiTypography-root {
    font-size: 14px;
    line-height: 16px;
    padding: 0 0 0 5px;
    color: ${props => (props.selected ? props.theme.text.selected : props.theme.text.default)};
  }
`;

export const RadioInput = ({
  options,
  name,
  value,
  label,
  helperText,
  fullWidth,
  style,
  ...props
}) => (
  <OuterLabelFieldWrapper label={label} {...props} style={style}>
    <StyledFormControl {...props}>
      <StyledRadioGroup
        length={options.length}
        aria-label={name}
        name={name}
        value={value || ''}
        {...props}
      >
        {options.map(option => (
          <ControlLabel
            key={option.value}
            control={<Radio value={option.value} selected={value === option.value} />}
            label={option.label}
            value={option.value}
            $fullWidth={fullWidth}
            selected={value === option.value}
            theme={
              option.color
                ? {
                    color: { default: Colors.midText, selected: option.color },
                    background: { default: Colors.white, selected: `${option.color}11` },
                    border: { default: option.color, selected: option.color },
                    text: { default: Colors.darkText, selected: Colors.darkestText },
                  }
                : DEFAULT_LABEL_THEME
            }
          />
        ))}
      </StyledRadioGroup>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </StyledFormControl>
  </OuterLabelFieldWrapper>
);

RadioInput.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.instanceOf(Object)).isRequired,
  fullWidth: PropTypes.bool,
};

RadioInput.defaultProps = {
  value: false,
  fullWidth: false,
};

export const RadioField = ({ field, error, ...props }) => (
  <RadioInput
    name={field.name}
    value={field.value || ''}
    onChange={field.onChange}
    error={error || undefined}
    {...props}
  />
);
