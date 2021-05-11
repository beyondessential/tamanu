import React, { useState, useContext } from 'react';
import { connect } from 'react-redux';
import { get } from 'lodash';

const overrides = {}; // add keys to this object to help with development

const FeatureFlagsContext = React.createContext({
  getFlag: () => {},
});

export const useFlags = () => useContext(FeatureFlagsContext);

const DumbFeatureFlagsProvider = ({ reduxFeatureFlags }) => {
  const [featureFlags, setFeatureFlags] = useState({});

  useEffect(
    () => {
      setFeatureFlags({ ...reduxFeatureFlags, ...overrides });
    },
    [reduxFeatureFlags],
  );

  return (
    <FeatureFlagsContext.Provider
      value={{
        getFlag: path => get(featureFlags, path),
      }}
    >
      {children}
    </FeatureFlagsContext.Provider>
  );
};

// we wrap this in a FeatureFlagsProvider because it's a side effect of logging in
// and logging in is still handled within a redux reducer
export const FeatureFlagsProvider = connect(({ auth: { featureFlags } }) => ({
  reduxFeatureFlags: featureFlags,
}))(DumbFeatureFlagsProvider);
