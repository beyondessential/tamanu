import React, { useEffect, useState } from 'react';
import { SettingsContext } from '../../app/contexts/Settings';
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
