import React, { createContext, useContext, useState, PropsWithChildren, ReactElement } from 'react';
import { DevSettings } from 'react-native';

interface TranslationContextData {
  getDebugMode: () => boolean;
  toggleDebugMode: () => void;
}

const TranslationContext = createContext<TranslationContextData>({} as TranslationContextData);

export const TranslationProvider = ({ children }: PropsWithChildren<object>): ReactElement => {
  const [isDebugMode, setIsDebugMode] = useState(false);

  const toggleDebugMode = () => setIsDebugMode(!isDebugMode);

  if (__DEV__) {
    DevSettings.addMenuItem('Toggle translation highlighting', async () => {
      setIsDebugMode(!isDebugMode);
      console.log(isDebugMode)
    });
  }

  return (
    <TranslationContext.Provider
      value={{
        getDebugMode: () => isDebugMode,
        toggleDebugMode,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = (): TranslationContextData => useContext(TranslationContext);
