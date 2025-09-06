import React from 'react';
import PropTypes from 'prop-types';

import { useAuth } from '../contexts/Auth';

export const withPermissionCheck = (Component) => {
  const PermissionCheckedComponent = ({ verb, noun, subject = null, ...props }) => {
    const { ability } = useAuth();
    // When auth is reloading ability.can can be temporarily undefined
    const subjectObject = subject ? subject : noun;
    const hasPermission = typeof ability.can === 'function' && ability.can(verb, subjectObject);
    return <Component {...props} hasPermission={hasPermission} data-testid="component-enxe" />;
  };

  PermissionCheckedComponent.propTypes = {
    verb: PropTypes.string.isRequired,
    noun: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  };

  return PermissionCheckedComponent;
};
