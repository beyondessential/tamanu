import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import CheckIcon from '@mui/icons-material/Check';
import RemoveIcon from '@mui/icons-material/Remove';
import { Colors } from '../../constants';

// TODO: finish the checkbox styling

const BoxIcon = styled.div`
  border: 1px ${Colors.outline} solid;
  height: 14px;
  width: 14px;
  background-color: white;
  border-radius: 3px;
  display: flex;
  .MuiSvgIcon-root {
    font-size: 12px;
    color: ${Colors.primary};
  }
`;

// TODO: unsure if correct color
const DisabledBoxIcon = styled(BoxIcon)`
  border: 1px ${Colors.softOutline} solid;
`;

const SelectedBoxIcon = styled(BoxIcon)`
  border: 1px ${Colors.primary} solid;
`;

/*
  Note that the Checkbox value prop only controls what gets sent,
  not the checkbox state. It's also worth noting that usually forms
  will send the state value, not the prop value.
*/
export const CheckControl = React.memo(({ value, ...props }) => (
  <Checkbox
    icon={props.disabled ? <DisabledBoxIcon /> : <BoxIcon />}
    checkedIcon={
      <SelectedBoxIcon>
        <CheckIcon />
      </SelectedBoxIcon>
    }
    indeterminateIcon={
      <SelectedBoxIcon>
        <RemoveIcon />
      </SelectedBoxIcon>
    }
    {...props}
    checked={Boolean(value)}
    value="true"
  />
));

const ControlLabel = styled(FormControlLabel)`
  align-items: flex-start;

  .MuiTypography-root {
    font-size: 16px;
    line-height: 18px;
  }
`;

const ControlCheck = styled(CheckControl)`
  padding-top: 0;
  padding-bottom: 0;
  margin-left: 3px;
  width: max-content;
`;

export const CheckInput = React.memo(
  ({ label, value, className, style, error, helperText, ...props }) => (
    <FormControl style={style} className={className} error={error}>
      <ControlLabel
        control={<ControlCheck value={value} {...props} />}
        style={style}
        label={label}
        $color={error ? Colors.alert : null}
      />
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
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
