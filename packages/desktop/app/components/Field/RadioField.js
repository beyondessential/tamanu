import React, { useEffect } from 'react';
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
  ${props => (props.$color ? `border-color: ${props.$color}` : '')};
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
  error,
  autofillSingleAvailableOption = false,
  ...props
}) => {
  const { onChange } = props;

  useEffect(() => {
    if (!autofillSingleAvailableOption) {
      return;
    }

    const validOptions = options.filter(o => !o.disabled);
    if (validOptions.length === 1) {
      onChange({ target: { value: validOptions[0].value, name } });
    }
    // only trigger autofill when options are changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);
  return (
    <OuterLabelFieldWrapper label={label} error={error} {...props} style={style}>
      <StyledFormControl error={error} {...props}>
        <StyledRadioGroup
          length={options.length}
          aria-label={name}
          name={name}
          value={value || ''}
          error={error}
          {...props}
        >
          {options.map(option => (
            <>
              {option.leftOptionalElement ? option.leftOptionalElement : null}
              <ControlLabel
                key={option.value}
                labelPlacement={option.description ? 'start' : 'end'}
                $color={error ? Colors.alert : null}
                control={
                  <Radio
                    value={option.value}
                    selected={value === option.value}
                    {...(option.icon
                      ? {
                          icon: option.icon,
                        }
                      : {})}
                    disabled={option.disabled}
                  />
                }
                label={option.label}
                value={option.value}
                $fullWidth={fullWidth}
                selected={value === option.value}
                style={option.style}
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
            </>
          ))}
        </StyledRadioGroup>
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </StyledFormControl>
    </OuterLabelFieldWrapper>
  );
};

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
