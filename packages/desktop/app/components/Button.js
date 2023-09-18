import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { red } from '@material-ui/core/colors';
import {
  Icon,
  IconButton,
  Button as MuiButton,
  ButtonBase as MuiButtonBase,
} from '@material-ui/core';
import {
  AddBoxOutlined,
  IndeterminateCheckBox,
  ChevronLeft,
  Refresh,
  Lock,
} from '@material-ui/icons';
import { Colors } from '../constants';
import { withPermissionCheck } from './withPermissionCheck';
import { withPermissionTooltip } from './withPermissionTooltip';

export const ButtonBase = props => {
  const locationsProps = getLocationProps(props);
  return <MuiButtonBase {...props} {...locationsProps} />;
};

const StyledButton = styled(MuiButton)`
  font-weight: 500;
  font-size: 14px;
  line-height: 16px;
  text-transform: none;
  padding: 11px 18px 12px 18px;
  box-shadow: none;

  .MuiSvgIcon-root {
    width: 19.5px;
    height: auto;
    margin-right: 10px;
  }

  &.MuiButton-sizeSmall {
    padding-left: 14px;
    padding-right: 14px;
  }

  &.MuiButton-outlinedPrimary {
    border-color: ${props => props.theme.palette.primary.main};
  }
`;

export const Button = ({ children, isSubmitting, disabled, hasPermission = true, ...props }) => {
  const locationsProps = getLocationProps(props);
  const displayLock = !isSubmitting && !hasPermission;
  return (
    <StyledButton
      {...props}
      {...locationsProps}
      disabled={disabled || isSubmitting || !hasPermission}
    >
      {isSubmitting && (
        <Icon className="fa fa-spinner fa-spin" style={{ marginRight: 4, fontSize: 18 }} />
      )}
      {displayLock && <Lock />}
      {children}
    </StyledButton>
  );
};

Button.propTypes = {
  isSubmitting: PropTypes.bool,
  disabled: PropTypes.bool,
  variant: PropTypes.PropTypes.oneOf(['contained', 'outlined', 'text']),
  color: PropTypes.PropTypes.oneOf(['default', 'primary', 'secondary']),
};

Button.defaultProps = {
  isSubmitting: false,
  disabled: false,
  variant: 'contained',
  color: 'primary',
};

const StyledOutlinedButton = styled(StyledButton)`
  border-color: ${props => props.theme.palette.primary.main};
  :disabled {
    border-color: ${Colors.softText};
  }
`;

export const OutlinedButton = props => (
  <StyledOutlinedButton variant="outlined" color="primary" {...props} />
);

export const GreyOutlinedButton = styled(props => <StyledButton {...props} />)`
  border: 1px solid #dedede;
  color: ${props => props.theme.palette.text.secondary};
`;

export const RedOutlinedButton = styled(props => <StyledButton {...props} />)`
  border: 1px solid ${Colors.alert};
  color: ${Colors.alert};
`;

const StyledLargeButton = styled(StyledButton)`
  font-size: 15px;
  line-height: 18px;
  padding: 12px 25px;
  border: 1px solid ${props => props.theme.palette.primary.main};
`;

export const LargeButton = props => (
  <StyledLargeButton variant="contained" color="primary" {...props} />
);

export const LargeOutlineButton = props => (
  <StyledLargeButton variant="outlined" color="primary" {...props} />
);

const StyledDeleteButton = styled(Button)`
  background: ${red[600]};
  color: ${Colors.white};

  :hover {
    background: ${red[800]};
  }
`;

export const DeleteButton = props => {
  const { children } = props;
  return (
    <StyledDeleteButton variant="contained" {...props}>
      {children || 'Delete'}
    </StyledDeleteButton>
  );
};

const StyledTextButton = styled(Button)`
  font-size: 16px;
  text-transform: capitalize;
  padding: 0;
  min-height: auto;
  min-width: auto;
  color: #5b84ad;
  :hover {
    background: rgba(0, 0, 0, 0);
    color: #23476b;
    font-weight: 500;
  }
`;

export const TextButton = ({ children, ...props }) => (
  <StyledTextButton variant="text" color="primary" {...props}>
    {children}
  </StyledTextButton>
);

const StyledNavButton = styled(TextButton)`
  color: ${Colors.primary};
  padding-right: 8px;
  font-size: 12px;
  & svg {
    font-size: 20px;
  }
`;

export const BackButton = ({ to, text = true, ...props }) => (
  <StyledNavButton to={to} {...props}>
    <ChevronLeft />
    {text && ' Back'}
  </StyledNavButton>
);

export const PlusIconButton = ({ ...props }) => (
  <IconButton color="primary" {...props}>
    <AddBoxOutlined fontSize="inherit" />
  </IconButton>
);

export const MinusIconButton = ({ ...props }) => (
  <IconButton color="primary" {...props}>
    <IndeterminateCheckBox fontSize="inherit" />
  </IconButton>
);

export const RefreshIconButton = ({ ...props }) => (
  <IconButton color="primary" {...props}>
    <Refresh fontSize="inherit" />
  </IconButton>
);

export const DefaultIconButton = styled(({ children, ...props }) => (
  <IconButton {...props}>{children}</IconButton>
))`
  border-radius: 20%;
  padding: 0px;
`;

const getLocationProps = ({ to }) => {
  if (to) {
    return { component: Link, to };
  }
  return {};
};

const ButtonWithPermissionTooltip = withPermissionTooltip(Button);
export const ButtonWithPermissionCheck = withPermissionCheck(ButtonWithPermissionTooltip);
