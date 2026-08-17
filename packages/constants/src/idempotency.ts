// spec: IDEM
// Lifecycle of a recorded idempotency key: claimed while its request runs, then
// completed once the outcome is recorded.
export const IDEMPOTENCY_KEY_STATUSES = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export type IdempotencyKeyStatus =
  (typeof IDEMPOTENCY_KEY_STATUSES)[keyof typeof IDEMPOTENCY_KEY_STATUSES];
