import React from 'react';
import PropTypes from 'prop-types';

export const Button = ({ primary, className, ...props }) => {
  const compiledClassName = [
    primary ? 'is-primary' : '',
    className,
    'button'
  ].join(' ');

  return <button
    className={ compiledClassName }
    { ...props }
  />;
};
