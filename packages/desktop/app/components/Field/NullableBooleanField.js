import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';

import FormLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';

import MuiButton from '@material-ui/core/Button';
import MuiButtonGroup from '@material-ui/core/ButtonGroup';

const StyledButtonGroup = styled(MuiButtonGroup)`
  margin: 0 1rem;
`;

const ControlLabel = styled(FormLabel)`
  width: max-content;

  > span {
    font-size: 16px;
  }
`;

const NullableBooleanControl = React.memo(({ value, onChange, disabled, name }) => {
  const onClickTrue = () => { 
    const newValue = (value === true) ? undefined : true;
    onChange({ target: { name, value: newValue } });
  };

  const onClickFalse = () => { 
    const newValue = (value === false) ? undefined : false;
    onChange({ target: { name, value: newValue } });
  };

  return (
    <StyledButtonGroup size="small" variant="contained">
      <MuiButton disabled={disabled} onClick={onClickTrue} color={ value === true && "primary" }>Yes</MuiButton>
      <MuiButton disabled={disabled} onClick={onClickFalse} color={ value === false && "primary" }>No</MuiButton>
    </StyledButtonGroup>
  );
});

export const NullableBooleanInput = React.memo(({ label, helperText, className, style, error, ...props }) => {
  return (
    <FormControl style={style} error={error} className={className}>
      <ControlLabel
        control={<NullableBooleanControl {...props} />} 
        label={label} 
      />
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
});

export const NullableBooleanField = React.memo(({ field, error, ...props }) => (
  <NullableBooleanInput
    name={field.name}
    value={field.value}
    onChange={field.onChange}
    {...props}
  />
));

NullableBooleanInput.propTypes = {
  name: PropTypes.string,
  value: PropTypes.oneOf(true, false, null),
  label: PropTypes.string,
  onChange: PropTypes.func,
};

NullableBooleanInput.defaultProps = {
  value: null,
  label: '',
  onChange: undefined,
  name: undefined,
};
