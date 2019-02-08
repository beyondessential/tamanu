import React from 'react';
import { isEmpty } from 'lodash';

import { Link } from 'react-router-dom';
import MuiButtonBase from '@material-ui/core/ButtonBase';
import MuiButton from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core';
import { red } from '@material-ui/core/colors';
import { checkAbility } from '../utils/ability-context';
import { history } from '../utils';

export const ButtonBase = (props) => {
  const allowed = _isAllowed(props);
  const locationsProps = _getLocationProps(props);
  return <MuiButtonBase
    { ...props }
    { ...locationsProps }
    disabled={!allowed || props.disabled} />;
};

export const Button = (props) => {
  const allowed = _isAllowed(props);
  const locationsProps = _getLocationProps(props);
  return <MuiButton
    { ...props }
    { ...locationsProps }
    disabled={!allowed || props.disabled} />;
};

export const BackButton = ({ to, onClick, ...props }) => {
  const { goBack } = history;
  let newClick = onClick;
  if (!to && !onClick) {
    newClick = () => goBack();
  }
  return <Button
    variant="outlined"
    onClick={ newClick }
    { ...props }
  >Back</Button>;
};

export const ClearButton = (props) => {
  return <Button
    variant="outlined"
    { ...props }
  >Clear</Button>;
};

export const CancelButton = (props) => {
  return <Button
    variant="contained"
    { ...props }
  >Cancel</Button>;
};

const deleteButtonStyles = theme => ({
  root: {
    backgroundColor: red[600],
    color: theme.palette.common.white,
    '&:hover': {
      backgroundColor: red[800],
    }
  }
})

export const DeleteButton = withStyles(deleteButtonStyles)((props) => {
  return <Button
    variant="contained"
    { ...props }
  >Delete</Button>;
});

export const SearchButton = (props) => {
  return <Button
    variant="contained"
    color="primary"
    { ...props }
  >Search</Button>;
};

export const AddButton = (props) => {
  return <Button
    variant="contained"
    color="primary"
    { ...props }
  >Add</Button>;
};

export const EditButton = (props) => {
  return <Button
    variant="contained"
    color="secondary"
    { ...props }
  >Edit</Button>;
};

export const FilterButton = (props) => {
  return <Button
    variant="contained"
    color="primary"
    { ...props }
  >Filter</Button>;
};

export const UpdateButton = (props) => {
  return <Button
    variant="contained"
    color="primary"
    { ...props }
  >Update</Button>;
};

export const NewButton = ({ children, ...props }) => {
  return <Button
    variant="outlined"
    { ...props }
  >{children}</Button>;
};

const textButtonStyles = theme => {
  return {
    root: {
      fontSize: theme.spacing.unit * 2,
      textTransform: 'capitalize',
      fontWeight: 400,
      padding: 0,
      minHeight: 'auto',
      minWidth: 'auto',
      color: theme.palette.primary.light,
      '&:hover': {
        backgroundColor: 'rgba(0,0,0,0)',
        color: theme.palette.primary.dark,
        fontWeight: 500
      }
    }
  }
}

export const TextButton = withStyles(textButtonStyles)(({ children, ...props }) => {
  return <Button
    variant="text"
    color="primary"
    { ...props }
  >{children}</Button>;
});

const _isAllowed = ({ can = {} }) => {
  let allowed = true;
  const { do: action, on: subject } = can;
  if (!isEmpty(can)) {
    allowed = checkAbility({ action, subject });
  }
  return allowed;
}

const _getLocationProps = ({ to }) => {
  if (to) {
    return { component: Link, to };
  }
  return {};
}
