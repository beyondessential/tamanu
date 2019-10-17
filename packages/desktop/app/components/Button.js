import React from 'react';
import { isEmpty } from 'lodash';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

import MuiButtonBase from '@material-ui/core/ButtonBase';
import MuiButton from '@material-ui/core/Button';
import Icon from '@material-ui/core/Icon';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import { red } from '@material-ui/core/colors';
import { checkAbility } from '../utils/ability';
import { hexToRgba } from '../utils';
import { Colors } from '../constants';

export const ButtonBase = props => {
  const allowed = isAllowed(props);
  const locationsProps = getLocationProps(props);
  return <MuiButtonBase {...props} {...locationsProps} disabled={!allowed || props.disabled} />;
};

const StyledButton = styled(MuiButton)`
  text-transform: capitalize;
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
    Delete
  </StyledDeleteButton>
);

export const SearchButton = props => (
  <Button variant="contained" color="primary" {...props}>
    Search
  </Button>
);

export const AlertButton = styled(Button)`
  color: ${Colors.white};
  background: ${Colors.alert};

  :hover {
    background: ${hexToRgba(Colors.alert, 0.08)};
  }
`;

export const DischargeButton = props => (
  <AlertButton variant="contained" {...props}>
    Discharge Patient
  </AlertButton>
);

export const CheckInButton = props => (
  <Button variant="contained" color="secondary" {...props}>
    Check In
  </Button>
);

export const CheckOutButton = props => (
  <Button variant="contained" color="secondary" {...props}>
    Check Out
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
    {children} <ChevronRightIcon />
  </StyledNavButton>
);

export const BackButton = ({ to, onClick, ...props }) => {
  return (
    <StyledNavButton to={to} onClick={onClick} {...props}>
      <ChevronLeftIcon /> Back
    </StyledNavButton>
  );
};

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
