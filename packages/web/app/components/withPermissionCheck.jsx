import React from 'react';
import PropTypes from 'prop-types';

import { usePermission } from '../hooks/usePermission';

export const withPermissionCheck = Component => {
  const PermissionCheckedComponent = ({ verb, noun, ...props }) => {
    const hasPermission = usePermission(verb, noun);
    return <Component {...props} hasPermission={hasPermission} />;
  };

  PermissionCheckedComponent.propTypes = {
    verb: PropTypes.string.isRequired,
    noun: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  };

  return PermissionCheckedComponent;
};
