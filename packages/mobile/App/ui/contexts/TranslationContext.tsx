import React, { createContext, useContext, useState, PropsWithChildren, ReactElement } from 'react';
import { DevSettings } from 'react-native';

interface TranslationContextData {
  debugMode: boolean;
}

const TranslationContext = createContext<TranslationContextData>({} as TranslationContextData);

export const TranslationProvider = ({ children }: PropsWithChildren<object>): ReactElement => {
  const [isDebugMode, setIsDebugMode] = useState(false);

  if (__DEV__) {
    DevSettings.addMenuItem('Toggle translation highlighting', () => setIsDebugMode(!isDebugMode));
  }

  return (
    <TranslationContext.Provider
      value={{
        debugMode: isDebugMode,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = (): TranslationContextData => useContext(TranslationContext);
