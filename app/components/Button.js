import React from 'react';
import PropTypes from 'prop-types';

import { Link } from 'react-router-dom';
import MuiButton from '@material-ui/core/Button';

export const Button = ({ primary, ...props }) => {
  return <MuiButton
    { ...props }
  />;
};

export const BackButton = ({ to, ...props }) => {
  if(to) {
    return <Button
      variant="outlined"
      component={ Link }
      to={ to }
      { ...props }
    >Back</Button>;
  } else {
    return <Button
      variant="outlined"
      { ...props }
    >Back</Button>;
  }
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




