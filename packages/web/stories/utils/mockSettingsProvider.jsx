import React from 'react';
import { SettingsContext } from '@tamanu/ui-components';
import { get } from 'lodash';

export const MockSettingsProvider = ({ children, mockSettings }) => {
  return (
    <SettingsContext.Provider
      value={{
        getSetting: path => get(mockSettings, path),
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
