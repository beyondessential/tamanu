import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import React from 'react';
import styled from 'styled-components';

import { TAMANU_COLORS } from '../../constants';
import { useTranslation } from '../../contexts';
import { TranslatedText } from '../Translation';

const ControlLabel = styled(FormLabel).attrs({
  'data-testid': 'controllabel-q0hy',
})`
  width: max-content;
  align-items: flex-start;
  margin-left: 0;

  .MuiTypography-root {
    color: ${TAMANU_COLORS.darkText};
    font-weight: 500;
    font-size: 14px;
    line-height: 1.15;
    letter-spacing: 0;
    margin-bottom: 5px;
  }
`;

const RequiredLabel = styled.span`
  color: ${TAMANU_COLORS.alert};
  padding-inline-start: 3px;
  &::before {
    content: '*' / '${p => p.$alt}';
  }
`;

/**
 * @param {Omit<
 *   import('@mui/material/ToggleButtonGroup').ToggleButtonGroupProps, 'onChange' | 'value'
 * > & {
 *   value: 'true' | 'false';
 *   onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
 *   name: string;
 * }} props
 */
const NullableBooleanControl = ({ value, onChange, name, ...props }) => {
  const handleChange = (e, next) => onChange({ ...e, target: { ...e.target, name, value: next } });
  return (
    <ToggleButtonGroup
      color="primary"
      data-testid="muitogglebuttongroup-6w6p"
      exclusive
      name={name}
      onChange={handleChange}
      size="small"
      value={value}
      {...props}
    >
      <ToggleButton key="true" value="true">
        <TranslatedText stringId="general.action.yes" fallback="Yes" />
      </ToggleButton>
      <ToggleButton key="false" value="false">
        <TranslatedText stringId="general.action.no" fallback="No" />
      </ToggleButton>
    </ToggleButtonGroup>
  );
};

export const NullableBooleanInput = ({
  className,
  error,
  helperText,
  inputRef,
  label,
  required,
  style,
  ...props
}) => {
  const { getTranslation } = useTranslation();
  return (
    <FormControl
      style={style}
      error={error}
      className={className}
      ref={inputRef}
      data-testid="formcontrol-aoaf"
    >
      <ControlLabel
        labelPlacement="top"
        control={<NullableBooleanControl {...props} data-testid="nullable-boolean-field-control" />}
        label={
          <div>
            {label}
            {required && (
              <RequiredLabel $alt={getTranslation('general.label.required', 'Required')} />
            )}
          </div>
        }
      />
      {helperText && (
        <FormHelperText data-testid="nullable-boolean-field-formhelpertext">
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
};

export const NullableBooleanField = ({ field, ...props }) => (
  <NullableBooleanInput
    name={field.name}
    value={field.value}
    onChange={field.onChange}
    {...props}
  />
);
