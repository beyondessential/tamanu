import React, { ReactElement, ReactNode, useEffect, useState } from 'react';

type Replacements = {[key: string]: ReactNode};
interface TranslatedTextProps {
  stringId: string;
  fallback: string;
  replacements?: Replacements;
};

// Duplicated from TranslatedText.js on desktop
const replaceStringVariables = (templateString: string, replacements: Replacements) => {
  const jsxElements = templateString.split(/(:[a-zA-Z]+)/g).map((part, index) => {
    // Even indexes are the unchanged parts of the string
    if (index % 2 === 0) return part;
    return replacements[part.slice(1)] || part;
  });

  return jsxElements;
};

export const TranslatedText = ({
  stringId,
  fallback,
  replacements,
}: TranslatedTextProps): ReactElement => {
  const [displayElements, setDisplayElements] = useState<ReactNode>(fallback);
  // Placeholder for fetching translation from context
  const translation = null;

  const stringToDisplay = translation || fallback;

  useEffect(() => {
    if (!replacements) {
      setDisplayElements(stringToDisplay);
      return;
    }
    setDisplayElements(replaceStringVariables(stringToDisplay, replacements));
  }, [translation]);

  return <>{displayElements}</>;
};
