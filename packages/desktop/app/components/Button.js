import React from 'react';
import { isEmpty } from 'lodash';
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
  ChevronRight,
  Refresh,
} from '@material-ui/icons';

import { checkAbility } from '../utils/ability';
import { Colors } from '../constants';

export const ButtonBase = props => {
  const allowed = isAllowed(props);
  const locationsProps = getLocationProps(props);
  return <MuiButtonBase {...props} {...locationsProps} disabled={!allowed || props.disabled} />;
};

const StyledButton = styled(MuiButton)`
  font-weight: 500;
  font-size: 14px;
  line-height: 16px;
  text-transform: none;
  padding: 11px 20px 12px;
  box-shadow: none;
`;

export const Button = ({ children, isSubmitting, disabled, ...props }) => {
  const allowed = isAllowed(props);
  const locationsProps = getLocationProps(props);
  return (
    <StyledButton {...props} {...locationsProps} disabled={!allowed || disabled || isSubmitting}>
      {isSubmitting && (
        <Icon className="fa fa-spinner fa-spin" style={{ marginRight: 4, fontSize: 18 }} />
      )}
      {children}
    </StyledButton>
  );
};

const StyledOutlinedButton = styled(StyledButton)`
  border-color: ${props => props.theme.palette.primary.main};
`;

export const OutlinedButton = props => (
  <StyledOutlinedButton variant="outlined" color="primary" {...props} />
);

export const ClearButton = props => (
  <Button variant="outlined" {...props}>
    Clear
  </Button>
);

export const CancelButton = props => (
  <Button variant="contained" {...props}>
    Cancel
  </Button>
);

const StyledDeleteButton = styled(Button)`
  background: ${red[600]};
  color: ${Colors.white};

  :hover {
    background: ${red[800]};
  }
`;

export const DeleteButton = props => (
  <StyledDeleteButton variant="contained" {...props}>
    {props.children || 'Delete'}
  </StyledDeleteButton>
);

export const SearchButton = props => (
  <Button variant="contained" color="primary" {...props}>
    Search
  </Button>
);

export const CheckInButton = props => (
  <Button variant="contained" color="secondary" {...props}>
    Check-in
  </Button>
);

export const CheckOutButton = props => (
  <Button variant="contained" color="secondary" {...props}>
    Check-out
  </Button>
);

export const AddButton = props => (
  <Button variant="contained" color="primary" {...props}>
    Add
  </Button>
);

export const EditButton = props => (
  <Button variant="contained" color="secondary" {...props}>
    Edit
  </Button>
);

export const FilterButton = props => (
  <Button variant="contained" color="primary" {...props}>
    Filter
  </Button>
);

export const UpdateButton = props => (
  <Button variant="contained" color="primary" {...props}>
    Update
  </Button>
);

export const NewButton = ({ children, ...props }) => (
  <Button variant="outlined" {...props}>
    {children}
  </Button>
);

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
  font-size: 14px;
`;

export const ForwardButton = ({ children, ...props }) => (
  <StyledNavButton {...props}>
    {children}
    <ChevronRight />
  </StyledNavButton>
);

export const BackButton = ({ to, text = true, ...props }) => (
  <StyledNavButton to={to} {...props}>
    <ChevronLeft />
    {text && ' Back'}
  </StyledNavButton>
);

const StyledImageButton = styled(Button)`
  background: ${Colors.white};
  padding: 16px;
  img {
    max-width: 52px;
    max-height: 52px;
    padding-right: 10px;
  }
`;

export const ImageButton = ({ children, ...props }) => (
  <StyledImageButton variant="contained" {...props}>
    <img src={props.src} />
    {children}
  </StyledImageButton>
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

const isAllowed = ({ can = {} }) => {
  let allowed = true;
  const { do: action, on: subject, field } = can;
  if (!isEmpty(can)) {
    allowed = checkAbility({ action, subject, field });
  }
  return allowed;
};

const getLocationProps = ({ to }) => {
  if (to) {
    return { component: Link, to };
  }
  return {};
};
