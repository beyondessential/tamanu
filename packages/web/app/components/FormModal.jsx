import React, { memo, useEffect, useState } from 'react';
import { Alert, AlertTitle } from '@material-ui/lab';

import { FormSubmissionProvider, useFormSubmission, BaseModal } from '@tamanu/ui-components';
import { IS_DEVELOPMENT } from '../utils/env';

const FormModalComponent = memo(({ children, ...props }) => {
  const { isClosable, hasFormSubmission } = useFormSubmission();
  const [showNotUsingFormWarning, setShowNotUsingFormWarning] = useState(false);

  useEffect(() => {
    const notUsingForm = IS_DEVELOPMENT && !hasFormSubmission;
    setShowNotUsingFormWarning(notUsingForm);
  }, [hasFormSubmission]);

  return (
    <BaseModal isClosable={isClosable} {...props} data-testid="basemodal-ufzv">
      {showNotUsingFormWarning && (
        <Alert
          severity="warning"
          onClose={() => setShowNotUsingFormWarning(false)}
          data-testid="alert-64xp"
        >
          <AlertTitle data-testid="alerttitle-f5qb">
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
    <FormSubmissionProvider data-testid="formsubmissionprovider-2ow3">
      <FormModalComponent {...props} data-testid="formmodalcomponent-m2oc" />
    </FormSubmissionProvider>
  );
});
