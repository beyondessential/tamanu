/* eslint-disable @typescript-eslint/no-unused-vars */
//@ts-nocheck
// Todo: Setup settings
import React from 'react';
import { get } from 'lodash';
import { SettingsContext } from '@tamanu/ui-components';

export const SettingsProvider = ({ children }) => {
  const settings = {};

  return (
    <SettingsContext.Provider
      value={{
        getSetting: path => get(settings, path),
        settings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
