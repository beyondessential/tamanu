import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import { Colors } from '../../constants';

const StyledIcon = styled.i`
  background-color: ${Colors.white};
  border-radius: 0.1875rem;
  font-size: 1rem;
  line-height: 0.875rem;
  margin: 0.0625rem 0;

  &.fa-check-square,
  &.fa-minus-square {
    color: ${({ $color }) => $color || Colors.primary};
  }
  &.fa-square {
    color: ${({ $color }) => $color || Colors.softText};
  }
`;

/*
  Note that the Checkbox value prop only controls what gets sent,
  not the checkbox state. It's also worth noting that usually forms
  will send the state value, not the prop value.
*/
export const CheckControl = React.memo(({ value, ...props }) => (
  <Checkbox
    icon={
      props.disabled ? (
        <StyledIcon className="fas fa-square" />
      ) : (
        <StyledIcon className="far fa-square" />
      )
    }
    checkedIcon={<StyledIcon className="far fa-check-square" />}
    indeterminateIcon={<StyledIcon className="far fa-minus-square"></StyledIcon>}
    {...props}
    checked={Boolean(value)}
    value="true"
  />
));

const ControlCheck = styled(CheckControl)`
  padding-top: 0;
  padding-bottom: 0;
  margin-left: 3px;
  width: max-content;
`;

export const CheckInput = React.memo(
  ({
    label,
    value,
    className,
    style,
    error,
    helperText,
    ['data-testid']: dataTestId,
    ...props
  }) => (
    <FormControl style={style} className={className} error={error}>
      <FormControlLabel
        control={
          <ControlCheck
            value={value}
            {...props}
            inputProps={{ 'data-testid': `${dataTestId}-controlcheck` }}
          />
        }
        style={style}
        label={label}
        $color={error ? Colors.alert : null}
      />
      {helperText && (
        <FormHelperText data-testid="formhelpertext-2d0o">{helperText}</FormHelperText>
      )}
    </FormControl>
  ),
);

export const CheckField = React.memo(({ field, ...props }) => (
  <CheckInput name={field.name} value={field.value} onChange={field.onChange} {...props} />
));

CheckInput.propTypes = {
  name: PropTypes.string,
  value: PropTypes.bool,
  label: PropTypes.node,
  onChange: PropTypes.func,
};

CheckInput.defaultProps = {
  value: false,
  label: '',
  onChange: undefined,
  name: undefined,
};
