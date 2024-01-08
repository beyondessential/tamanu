import React, { memo, useState, useEffect } from 'react';
import { Alert, AlertTitle } from '@material-ui/lab';

import { BaseModal } from './BaseModal';
import { useFormSubmission } from '../contexts/FormSubmission';
import { IS_DEVELOPMENT } from '../utils/env';

export const Modal = memo(({ children, disableDevWarning, ...props }) => {
  const { hasFormSubmission } = useFormSubmission();
  const [showUsingFormWarning, setShowUsingFormWarning] = useState(false);

  useEffect(() => {
    const usingForm =
      IS_DEVELOPMENT && hasFormSubmission && !disableDevWarning;
    setShowUsingFormWarning(usingForm);
  }, [hasFormSubmission, disableDevWarning]);

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
