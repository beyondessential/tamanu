import React, { Fragment, useEffect } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import { TranslatedEnumField } from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';

const DEFAULT_LABEL_THEME = {
  color: { default: Colors.outline, selected: Colors.primary },
  background: { default: Colors.white, selected: Colors.white },
  border: { default: Colors.outline, selected: Colors.primary },
  text: { default: Colors.darkText, selected: Colors.darkestText },
};

const StyledFormControl = styled(FormControl)`
  display: flex;
  flex-direction: column;
  margin-top: 2px;
  .MuiFormHelperText-root.Mui-error {
    font-weight: 500;
    font-size: 12px;
    line-height: 15px;
  }
`;

const StyledRadioGroup = styled(RadioGroup)`
  display: flex;
  align-items: stretch;
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

  &.MuiFormControlLabel-labelPlacementStart {
    padding: 16px 14px;
    align-items: stretch;
    .MuiButtonBase-root {
      align-self: flex-start;
    }
  }

  .MuiTypography-root {
    font-size: 14px;
    line-height: 16px;
    padding: 0 0 0 5px;
    color: ${props => (props.selected ? props.theme.text.selected : props.theme.text.default)};
  }
`;

const StyledLabelDescription = styled.p`
  font-size: 11px;
  color: ${Colors.midText};
  margin: 0;
  padding-right: 10px;
  width: 160px;
`;

const StyledLabelTitle = styled.p`
  font-size: 14px;
  color: ${Colors.darkestText};
  margin: 0;
  margin-bottom: 8px;
  font-weight: bold;
`;

const LabelWithDescription = ({ label, description }) => (
  <div>
    <StyledLabelTitle data-testid="styledlabeltitle-y511">{label}</StyledLabelTitle>
    <StyledLabelDescription data-testid="styledlabeldescription-zze1">
      {description}
    </StyledLabelDescription>
  </div>
);

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
  'data-testid': dataTestId = 'radioinput',
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
    <OuterLabelFieldWrapper
      label={label}
      error={error}
      {...props}
      style={style}
      data-testid="outerlabelfieldwrapper-ce71"
    >
      <StyledFormControl error={error} {...props} data-testid="styledformcontrol-67x0">
        <StyledRadioGroup
          length={options.length}
          aria-label={name}
          name={name}
          value={value || ''}
          error={error}
          {...props}
          data-testid={`${dataTestId}-styledradiogroup`}
        >
          {options.map(option => (
            <Fragment key={option.value}>
              {option.leftOptionalElement ?? null}
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
                    data-testid={`radio-il3t-${option.value}`}
                  />
                }
                label={
                  option.description ? (
                    <LabelWithDescription
                      label={option.label}
                      description={option.description}
                      data-testid={`labelwithdescription-cizd-${option.value}`}
                    />
                  ) : (
                    option.label
                  )
                }
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
                data-testid={`controllabel-kkx2-${option.value}`}
              />
            </Fragment>
          ))}
        </StyledRadioGroup>
        {helperText && (
          <FormHelperText data-testid="formhelpertext-sz5u">{helperText}</FormHelperText>
        )}
      </StyledFormControl>
    </OuterLabelFieldWrapper>
  );
};

RadioInput.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
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

export const TranslatedRadioField = ({ error, ...props }) => {
  return (
    <TranslatedEnumField
      error={error || undefined}
      {...props}
      component={RadioInput}
      data-testid="translatedenumfield-qh1t"
    />
  );
};
