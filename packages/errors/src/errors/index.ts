export { ClientIncompatibleError } from './ClientIncompatibleError.ts';
export { DatabaseError } from './DatabaseError.ts';
export { EditConflictError } from './EditConflictError.ts';
export { ForbiddenError } from './ForbiddenError.ts';
export { InsufficientStorageError } from './InsufficientStorageError.ts';
export { NotFoundError } from './NotFoundError.ts';
export { RateLimitedError } from './RateLimitedError.ts';
export { UnimplementedError } from './UnimplementedError.ts';
export { UnknownError } from './UnknownError.ts';
export { UsageError } from './UsageError.ts';

export { BaseRemoteError, RemoteCallError } from './RemoteError.ts';
export { RemoteIncompatibleError } from './RemoteIncompatibleError.ts';
export { RemoteUnreachableError } from './RemoteUnreachableError.ts';

export { BadAuthenticationError, BaseAuthenticationError } from './AuthenticationError.ts';
export { AuthPermissionError } from './auth/AuthPermissionError.ts';
export { InvalidCredentialError } from './auth/InvalidCredentialError.ts';
export { InvalidTokenError } from './auth/InvalidTokenError.ts';
export { MissingCredentialError } from './auth/MissingCredentialError.ts';
export { QuotaExceededError } from './auth/QuotaExceededError.ts';

export { BaseValidationError, ValidationError } from './ValidationError.ts';
export { DatabaseConstraintError } from './validation/DatabaseConstraintError.ts';
export { DatabaseDuplicateError } from './validation/DatabaseDuplicateError.ts';
export { DatabaseRelationError } from './validation/DatabaseRelationError.ts';
export { DatabaseValidationError } from './validation/DatabaseValidationError.ts';
export { InvalidOperationError } from './validation/InvalidOperationError.ts';
export { InvalidParameterError } from './validation/InvalidParameterError.ts';
