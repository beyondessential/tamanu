import React, { useCallback } from 'react';
import styled from 'styled-components';
import FormLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import MuiButton from '@material-ui/core/Button';
import MuiButtonGroup from '@material-ui/core/ButtonGroup';
import { TAMANU_COLORS } from '../../constants';
import { TranslatedText } from '../Translation';

const ControlLabel = styled(FormLabel)`
  width: max-content;
  align-items: flex-start;
  margin-left: 0;

  .MuiTypography-root {
    color: ${TAMANU_COLORS.darkText};
    font-weight: 500;
    font-size: 14px;
    line-height: 16px;
    letter-spacing: 0;
    margin-bottom: 5px;
  }
`;

const StyledFormHelperText = styled(FormHelperText)`
  font-weight: 500;
  font-size: 12px;
  line-height: 15px;
  margin: 4px 2px 2px;
`;

const RequiredLabel = styled.span`
  color: ${TAMANU_COLORS.alert};
  padding-left: 3px;
`;

const NullableBooleanControl = React.memo(({ value, onChange, disabled, name }) => {
  const onClickTrue = useCallback(() => {
    const newValue = value === true ? undefined : true;
    onChange({ target: { name, value: newValue } });
  }, [value, onChange, name]);

  const onClickFalse = useCallback(() => {
    const newValue = value === false ? undefined : false;
    onChange({ target: { name, value: newValue } });
  }, [value, onChange, name]);

  const yesColor = value === true ? 'primary' : '';
  const noColor = value === false ? 'primary' : '';

  return (
    <MuiButtonGroup
      size="small"
      variant="contained"
      disableElevation
      data-testid="muibuttongroup-6w6p"
    >
      <MuiButton
        disabled={disabled}
        onClick={onClickTrue}
        color={yesColor}
        data-testid="muibutton-ys2a"
      >
        <TranslatedText
          stringId="general.action.yes"
          fallback="Yes"
          data-testid="translatedtext-3qw1"
        />
      </MuiButton>
      <MuiButton
        disabled={disabled}
        onClick={onClickFalse}
        color={noColor}
        data-testid="muibutton-bif9"
      >
        <TranslatedText
          stringId="general.action.no"
          fallback="No"
          data-testid="translatedtext-02o7"
        />
      </MuiButton>
    </MuiButtonGroup>
  );
});

export const NullableBooleanInput = React.memo(
  ({ label, helperText, className, style, error, required, inputRef, ...props }) => (
    <FormControl
      style={style}
      error={error}
      className={className}
      ref={inputRef}
      data-testid="formcontrol-aoaf"
    >
      <ControlLabel
        labelPlacement="top"
        control={<NullableBooleanControl {...props} data-testid="nullablebooleancontrol-y1ik" />}
        label={
          <div>
            {label}
            {required && <RequiredLabel>*</RequiredLabel>}
          </div>
        }
        data-testid="controllabel-q0hy"
      />
      {helperText && (
        <StyledFormHelperText data-testid="styledformhelpertext-y0km">
          {helperText}
        </StyledFormHelperText>
      )}
    </FormControl>
  ),
);

export const NullableBooleanField = React.memo(({ field, ...props }) => (
  <NullableBooleanInput
    name={field.name}
    value={field.value}
    onChange={field.onChange}
    {...props}
  />
));
