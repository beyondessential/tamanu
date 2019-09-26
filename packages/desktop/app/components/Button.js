import React from 'react';
import { isEmpty } from 'lodash';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import MuiButtonBase from '@material-ui/core/ButtonBase';
import MuiButton from '@material-ui/core/Button';
import Icon from '@material-ui/core/Icon';
import { red } from '@material-ui/core/colors';
import { checkAbility } from '../utils/ability';
import { history } from '../utils';

export const ButtonBase = props => {
  const allowed = isAllowed(props);
  const locationsProps = getLocationProps(props);
  return <MuiButtonBase {...props} {...locationsProps} disabled={!allowed || props.disabled} />;
};

export const Button = ({ children, isSubmitting, disabled, ...props }) => {
  const allowed = isAllowed(props);
  const locationsProps = getLocationProps(props);
  return (
    <MuiButton {...props} {...locationsProps} disabled={!allowed || disabled || isSubmitting}>
      {isSubmitting && (
        <Icon className="fa fa-spinner fa-spin" style={{ marginRight: 4, fontSize: 18 }} />
      )}
      {children}
    </MuiButton>
  );
};

export const BackButton = ({ to, onClick, ...props }) => {
  const { goBack } = history;
  let newClick = onClick;
  if (!to && !onClick) {
    newClick = () => goBack();
  }
  return (
    <Button variant="outlined" to={to} onClick={newClick} {...props}>
      Back
    </Button>
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
  color: #fff;

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

export const DischargeButton = props => (
  <Button variant="contained" color="secondary" {...props}>
    Discharge
  </Button>
);

export const CheckInButton = props => (
  <Button variant="contained" color="secondary" {...props}>
    Check In
  </Button>
);

export const CheckOutButton = props => (
  <Button variant="contained" color="secondary" {...props} s>
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

const StyledImageButton = styled(Button)`
  background: #fff;
  img {
    max-width: 52px;
    max-height: 52px;
    padding-right: 10px;
  }
`;

export const ImageButton = ({ children, ...props }) => (
  <StyledImageButton variant="contained">
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
