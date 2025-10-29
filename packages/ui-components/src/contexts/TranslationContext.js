import React, { useContext } from 'react';

export const TranslationContext = React.createContext(null);

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation has been called outside a TranslationProvider.');
  }
  return context;
};
