import React from 'react';
import PropTypes from 'prop-types';

import { useAuth } from '../contexts/Auth';

export const withPermissionCheck = Component => {
  const PermissionCheckedComponent = ({ verb, noun, ...props }) => {
    const { ability } = useAuth();
    const hasPermission = ability.can(verb, noun);
    return <Component {...props} hasPermission={hasPermission} />;
  };

  PermissionCheckedComponent.propTypes = {
    verb: PropTypes.string.isRequired,
    noun: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  };

  return PermissionCheckedComponent;
};
