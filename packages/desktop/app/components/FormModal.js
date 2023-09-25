import React, { memo, useState, useEffect } from 'react';
import { Alert, AlertTitle } from '@material-ui/lab';

import { FormSubmissionProvider, useFormSubmission } from '../contexts/FormSubmission';
import { BaseModal } from './BaseModal';

const FormModalComponent = memo(({ children, ...props }) => {
  const { isClosable, hasFormSubmission } = useFormSubmission();
  const [showNotUsingFormWarning, setShowNotUsingFormWarning] = useState(false);

  useEffect(() => {
    const notUsingForm = process.env.NODE_ENV === 'development' && !hasFormSubmission;
    setShowNotUsingFormWarning(notUsingForm);
  }, [hasFormSubmission]);

  return (
    <BaseModal {...props} isClosable={isClosable}>
      {showNotUsingFormWarning && (
        <Alert severity="warning" onClose={() => setShowNotUsingFormWarning(false)}>
          <AlertTitle>
            DEV Warning: This Form Modal does not contain a Form. Please use generic Modal instead
          </AlertTitle>
        </Alert>
      )}
      {children}
    </BaseModal>
  );
});

export const FormModal = memo(({ ...props }) => {
  return (
    <FormSubmissionProvider>
      <FormModalComponent {...props} />
    </FormSubmissionProvider>
  );
});
