import React from 'react';
import PropTypes from 'prop-types';
import Tooltip from '@mui/material/Tooltip';
import { TranslatedText } from './Translation/TranslatedText';

export const withPermissionTooltip = Component => {
  const WrappedComponent = ({ hasPermission, ...props }) => {
    if (hasPermission) {
      return <Component {...props} hasPermission={hasPermission} />;
    }

    return (
      <Tooltip
        title={
          <TranslatedText
            stringId="permission.tooltip.denied"
            fallback="You do not have permission to complete this action."
            data-testid="translatedtext-no-permission"
          />
        }
        data-testid="tooltip-zl30"
      >
        {/*
          Tooltip needs a ref to its children, using an outer div will
          save us from having to modify every component passed to this HOC.
        */}
        <div>
          <Component {...props} hasPermission={hasPermission} />
        </div>
      </Tooltip>
    );
  };

  WrappedComponent.propTypes = {
    hasPermission: PropTypes.bool.isRequired,
  };

  return WrappedComponent;
};
