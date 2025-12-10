import {
  BaseError,
  DatabaseConstraintError,
  DatabaseDuplicateError,
  DatabaseError,
  DatabaseRelationError,
  DatabaseValidationError,
} from '@tamanu/errors';
import * as sequelize from 'sequelize';

export function convertDatabaseError(error: sequelize.BaseError): BaseError {
  if (error instanceof sequelize.ValidationError) {
    return new DatabaseValidationError(error.message).withCause(error).withExtraData({
      validations: error.errors.map(err => err.validatorName),
    });
  }

  if (error instanceof sequelize.ExclusionConstraintError) {
    return new DatabaseConstraintError(error.message).withCause(error).withExtraData({
      constraint: error.constraint,
    });
  }

  if (error instanceof sequelize.UnknownConstraintError) {
    return new DatabaseConstraintError(error.message).withCause(error).withExtraData({
      constraint: error.constraint,
    });
  }

  if (error instanceof sequelize.ForeignKeyConstraintError) {
    return new DatabaseRelationError(error.message).withCause(error).withExtraData({
      relation: error.index,
    });
  }

  if (error instanceof sequelize.UniqueConstraintError) {
    return new DatabaseDuplicateError(error.message).withCause(error);
  }

  return new DatabaseError(error.message).withCause(error);
}
