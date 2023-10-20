import React, { ReactElement, useEffect, useState } from 'react';

type TranslatedTextProps = {
  stringId: string;
  fallback: string;
};

export const TranslatedText = ({ stringId, fallback }: TranslatedTextProps): ReactElement => {
  const [displayElements, setDisplayElements] = useState(fallback);
  // Placeholder for fetching translation from context
  const translation = null;

  useEffect(() => {
    if (!translation) return;
    setDisplayElements(translation);
  }, [translation]);

  return <>{displayElements}</>;
};
