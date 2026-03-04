import React from 'react';

import { useAuth } from '../contexts/AuthContext';

export const withPermissionCheck = (Component) => {
  const PermissionCheckedComponent = ({ verb, noun, subject = null, ...props }) => {
    const { ability } = useAuth();
    // When auth is reloading ability.can can be temporarily undefined
    const subjectObject = subject ? subject : noun;
    const hasPermission = typeof ability.can === 'function' && ability.can(verb, subjectObject);
    return <Component {...props} hasPermission={hasPermission} data-testid="component-enxe" />;
  };

  return PermissionCheckedComponent;
};
