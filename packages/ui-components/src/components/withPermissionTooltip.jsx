import React from 'react';
import Tooltip from '@material-ui/core/Tooltip';
import { TranslatedText } from './Translation';

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

  return WrappedComponent;
};
