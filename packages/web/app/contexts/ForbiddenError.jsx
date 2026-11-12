import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

// Open/closed flag for the catch-all forbidden-error modal. An unhandled ForbiddenError
// (see PromiseErrorBoundary) opens it; the modal itself closes it.
const ForbiddenErrorContext = createContext({
  isOpen: false,
  setForbiddenError: () => {},
  clearForbiddenError: () => {},
});

export const useForbiddenError = () => useContext(ForbiddenErrorContext);

export const ForbiddenErrorProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Accepts and ignores an optional error argument so existing call sites are unaffected.
  const setForbiddenError = useCallback(() => setIsOpen(true), []);
  const clearForbiddenError = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ isOpen, setForbiddenError, clearForbiddenError }),
    [isOpen, setForbiddenError, clearForbiddenError],
  );

  return <ForbiddenErrorContext.Provider value={value}>{children}</ForbiddenErrorContext.Provider>;
};
