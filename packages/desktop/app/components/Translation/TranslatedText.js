import React from 'react';

export const TranslatedText = ({ stringId, fallback }) => {
  const translationExists = false; // Placeholder for checking db for translation

  if (!translationExists && !fallback) {
    return <>Unhandled translation</>;
  }

  if (!translationExists) {
    // Register as untranslated in DB
    return <>{fallback}</>;
  }

  return <>{stringId}</>;
};
