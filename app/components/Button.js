import React from 'react';
import PropTypes from 'prop-types';

import { Link } from 'react-router-dom';
import MuiButton from '@material-ui/core/Button';

export const Button = ({ primary, ...props }) => {
  return <MuiButton
    { ...props }
  />;
};

export const BackButton = ({ to }) => {
  return <Button
    variant="outlined"
    color="secondary"
    component={ Link }
    to={ to }
  >Back</Button>;
};

export const ClearButton = ({ ...props }) => {
  return <Button
    variant="outlined"
    color="secondary"
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

export const FilterButton = ({ ...props }) => {
  return <Button
    variant="contained"
    color="primary"
    { ...props }
  >Filter</Button>;
};




