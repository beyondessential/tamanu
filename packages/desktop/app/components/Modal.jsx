import { Alert, AlertTitle } from '@material-ui/lab';
import React, { memo, useEffect, useState } from 'react';

import { useFormSubmission } from '../contexts/FormSubmission';
import { BaseModal } from './BaseModal';

export const Modal = memo(({ children, disableDevWarning, ...props }) => {
  const { hasFormSubmission } = useFormSubmission();
  const [showUsingFormWarning, setShowUsingFormWarning] = useState(false);

  useEffect(() => {
    const usingForm = process.env.NODE_ENV === 'development' && hasFormSubmission &&
      !disableDevWarning;
    setShowUsingFormWarning(usingForm);
  }, [hasFormSubmission, disableDevWarning]);

  return (
    <BaseModal {...props}>
      {showUsingFormWarning && (
        <Alert
          severity="warning"
          onClose={() => setShowUsingFormWarning(false)}
        >
          <AlertTitle>
            DEV Warning: This generic Modal contains a Form. Please use Form Modal instead
          </AlertTitle>
        </Alert>
      )}
      {children}
    </BaseModal>
  );
});
