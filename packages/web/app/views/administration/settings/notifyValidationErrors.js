import { notifyError } from '../../../utils';

// One toast per failed rule: a yup aggregate carries the individual failures in
// `inner` (empty for a single failure — fall back to the error itself). Messages
// are truncated so one giant object-dump doesn't fill the screen.
export const notifyValidationErrors = validationError =>
  (validationError.inner?.length ? validationError.inner : [validationError]).forEach(e =>
    notifyError(e.message.length > 160 ? `${e.message.slice(0, 160)}…` : e.message),
  );
