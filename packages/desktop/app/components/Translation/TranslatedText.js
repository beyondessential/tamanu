import React from 'react';

export const TranslatedText = ({ stringId, fallback }) => {
  const translation = null; // Placeholder for checking db for translation

  if (!translation) {
    // Register as untranslated in DB
    return <>{fallback}</>;
  }

  return <>{translation}</>;
};
