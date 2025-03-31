import React from 'react';
import PropTypes from 'prop-types';
import Tooltip from '@material-ui/core/Tooltip';

export const withPermissionTooltip = Component => {
  const WrappedComponent = ({ hasPermission, ...props }) => {
    if (hasPermission) {
      return <Component {...props} hasPermission={hasPermission} data-testid='component-ru2y' />;
    }

    return (
      <Tooltip
        title="You do not have permission to complete this action."
        data-testid='tooltip-zl30'>
        {/*
          Tooltip needs a ref to its children, using an outer div will
          save us from having to modify every component passed to this HOC.
        */}
        <div>
          <Component {...props} hasPermission={hasPermission} data-testid='component-8kea' />
        </div>
      </Tooltip>
    );
  };

  WrappedComponent.propTypes = {
    hasPermission: PropTypes.bool.isRequired,
  };

  return WrappedComponent;
};
