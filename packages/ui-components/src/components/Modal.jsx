import React, { memo, useEffect, useState } from 'react';
import AlertTitle from '@mui/material/AlertTitle';

import { BaseModal } from './BaseModal';
import { useFormSubmission } from '../contexts';
import { IS_DEVELOPMENT } from '../utils/env';
import Alert from './Alert';

/**
 * @param {React.ComponentProps<typeof BaseModal> & {
 *   disableDevWarning?: boolean;
 * }} props
 */
export const Modal = memo(({ children, disableDevWarning, ...props }) => {
  const { hasFormSubmission } = useFormSubmission();
  const [showUsingFormWarning, setShowUsingFormWarning] = useState(false);

  useEffect(() => {
    const usingForm = IS_DEVELOPMENT && hasFormSubmission && !disableDevWarning;
    setShowUsingFormWarning(usingForm);
  }, [hasFormSubmission, disableDevWarning]);

  return (
    <BaseModal {...props} data-testid="basemodal-65p9">
      {showUsingFormWarning && (
        <Alert
          onClose={() => setShowUsingFormWarning(false)}
          severity="warning"
          style={{ marginBlockEnd: '1em' }}
        >
          <AlertTitle>Dev warning</AlertTitle>
          This generic <code>&lt;Modal&gt;</code> contains a form. Consider using{' '}
          <code>&lt;FormModal&gt;</code>.
        </Alert>
      )}
      {children}
    </BaseModal>
  );
});
