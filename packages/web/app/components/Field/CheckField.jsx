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

const BaseBox = styled.div`
  border: 1px ${Colors.outline} solid;
  height: 14px;
  width: 14px;
  background-color: white;
  border-radius: 3px;
  display: flex;
`;

const SelectedBox = styled(BaseBox)`
  border: 1px ${Colors.primary} solid;
`;

/*
  Note that the Checkbox value prop only controls what gets sent,
  not the checkbox state. It's also worth noting that usually forms
  will send the state value, not the prop value.
*/
export const CheckControl = React.memo(({ value, ...props }) => (
  <Checkbox
    icon={props.disabled ? <i className="fas fa-square" /> : <BaseBox />}
    checkedIcon={
      <SelectedBox>
        <CheckIcon color="primary" sx={{ fontSize: '12px' }} />
      </SelectedBox>
    }
    indeterminateIcon={
      <SelectedBox>
        <RemoveIcon color="primary" sx={{ fontSize: '12px' }} />
      </SelectedBox>
    }
    {...props}
    checked={Boolean(value)}
    value="true"
  />
));

const ControlLabel = styled(FormControlLabel)`
  align-items: flex-start;

  i,
  .MuiTypography-root {
    font-size: 16px;
    line-height: 18px;
  }
  i.fa-check-square {
    color: ${props => props.$color || Colors.primary};
  }
  i.fa-square {
    color: ${props => props.$color || Colors.softText};
  }
  i.fa-minus-square {
    color: ${props => props.$color || Colors.primary};
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
