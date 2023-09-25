import React, { memo, useState, useEffect } from 'react';
import { Alert, AlertTitle } from '@material-ui/lab';

import { BaseModal } from './BaseModal';
import { useFormSubmission } from '../contexts/FormSubmission';

export const Modal = memo(({ children, ...props }) => {
  const { hasFormSubmission } = useFormSubmission();
  const [showUsingFormWarning, setShowUsingFormWarning] = useState(false);

  useEffect(() => {
    const usingForm = process.env.NODE_ENV === 'development' && hasFormSubmission;
    setShowUsingFormWarning(usingForm);
  }, [hasFormSubmission]);

  return (
    <BaseModal {...props}>
      {showUsingFormWarning && (
        <Alert severity="warning" onClose={() => setShowUsingFormWarning(false)}>
          <AlertTitle>
            DEV Warning: This generic Modal contains a Form. Please use Form Modal instead
          </AlertTitle>
        </Alert>
      )}
      {children}
    </BaseModal>
  );
});
