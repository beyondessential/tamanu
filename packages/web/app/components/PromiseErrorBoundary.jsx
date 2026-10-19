import React, { useEffect } from 'react';
import { ForbiddenError } from '@tamanu/errors';
import { useForbiddenError } from '../contexts/ForbiddenError';

// This will catch all unhandled promise rejections.
// The intent is to open the Forbidden Error catch-all modal
// when the caller didn't handle the error.
export const PromiseErrorBoundary = ({ children }) => {
  const { setForbiddenError } = useForbiddenError();

  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      event.preventDefault();
      if (event.reason instanceof ForbiddenError) {
        setForbiddenError();
      } else {
        // eslint-disable-next-line no-console
        console.error(event.reason);
      }
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [setForbiddenError]);

  return <>{children}</>;
};
