import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { ForbiddenError } from 'shared/errors';
import { setForbiddenError } from '../store';

// This will catch all unhandled promise rejections.
// The intent is to open the Forbidden Error catch-all modal
// when the caller didn't handle the error.
export const PromiseErrorBoundary = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const handleUnhandledRejection = event => {
      event.preventDefault();
      if (event.reason instanceof ForbiddenError) {
        dispatch(setForbiddenError());
      } else {
        // eslint-disable-next-line no-console
        console.error(event.reason);
      }
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [dispatch]);

  return <>{children}</>;
};
