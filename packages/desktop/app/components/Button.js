import React from 'react';
import { isEmpty } from 'lodash';

import { Link } from 'react-router-dom';
import MuiButton from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core';
import { red } from '@material-ui/core/colors';
import { checkAbility } from '../utils/ability-context';

export const Button = ({ primary, ...props }) => {
  let allowed = true;
  const { can = {} } = props;
  const { do: action, on: subject } = can;
  if (!isEmpty(can)) {
    allowed = checkAbility({ action, subject });
  }
  return <MuiButton
    { ...props }
    disabled={!allowed || props.disabled}
  />;
};

export const BackButton = ({ to, ...props }) => {
  if (to) {
    return <Button
      variant="outlined"
      component={ Link }
      to={ to }
      { ...props }
    >Back</Button>;
  }

  return <Button
    variant="outlined"
    { ...props }
  >Back</Button>;
};

export const ClearButton = ({ ...props }) => {
  return <Button
    variant="outlined"
    { ...props }
  >Clear</Button>;
};

export const CancelButton = ({ ...props }) => {
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

export const DeleteButton = withStyles(deleteButtonStyles)(({ ...props }) => {
  return <Button
    variant="contained"
    { ...props }
  >Delete</Button>;
});

export const SearchButton = ({ ...props }) => {
  return <Button
    variant="contained"
    color="primary"
    { ...props }
  >Search</Button>;
};

export const AddButton = ({ ...props }) => {
  return <Button
    variant="contained"
    color="primary"
    { ...props }
  >Add</Button>;
};

export const FilterButton = ({ ...props }) => {
  return <Button
    variant="contained"
    color="primary"
    { ...props }
  >Filter</Button>;
};

export const UpdateButton = ({ ...props }) => {
  return <Button
    variant="contained"
    color="primary"
    { ...props }
  >Update</Button>;
};

export const NewButton = ({ to, children, ...props }) => {
  if (to) {
    return <Button
      variant="outlined"
      component={ Link }
      to={ to }
      { ...props }
    >{children}</Button>;
  }

  return <Button
    variant="outlined"
    { ...props }
  >{children}</Button>;
};

const textButtonStyles = theme => {
   console.log('-theme-', theme);
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
export const TextButton = withStyles(textButtonStyles)(({ to, children, ...props }) => {
  let newProps = props;
  if (to) {
    newProps = { ...newProps, to, component: Link };
  }
  return <Button
    variant="text"
    color="primary"
    { ...newProps }
  >{children}</Button>;
});
