import React from 'react';
import { isEmpty } from 'lodash';

import { Link } from 'react-router-dom';
import MuiButton from '@material-ui/core/Button';
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
