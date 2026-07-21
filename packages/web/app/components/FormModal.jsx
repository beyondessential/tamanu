import React, { memo, useEffect, useState } from 'react';
import AlertTitle from '@mui/material/AlertTitle';

import { Alert, FormSubmissionProvider, useFormSubmission, BaseModal } from '@tamanu/ui-components';
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
          onClose={() => setShowNotUsingFormWarning(false)}
          severity="warning"
          style={{ marginBlockEnd: '1em' }}
        >
          <AlertTitle>Dev warning</AlertTitle>
          This <code>&lt;FormModal&gt;</code> doesn’t contain a form. Consider using generic{' '}
          <code>&lt;Modal&gt;</code>.
        </Alert>
      )}
      {children}
    </BaseModal>
  );
});

export const FormModal = memo(props => {
  return (
    <FormSubmissionProvider data-testid="formsubmissionprovider-2ow3">
      <FormModalComponent {...props} data-testid="formmodalcomponent-m2oc" />
    </FormSubmissionProvider>
  );
});
