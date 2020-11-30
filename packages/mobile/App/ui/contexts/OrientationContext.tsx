import React, { createContext, ReactElement } from 'react';
import Orientation from 'react-native-orientation';

interface OrientationContextData {
  orientation: any;
}

export const OrientationContext = createContext<OrientationContextData>(
  {} as OrientationContextData,
);

export const OrientationProvider = ({ children }): ReactElement => (
  <OrientationContext.Provider
    value={{
      orientation: Orientation,
    }}
  >
    {children}
  </OrientationContext.Provider>
);
