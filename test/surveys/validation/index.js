/**
 * Tupaia MediTrak
 * Copyright (c) 2017 Beyond Essential Systems Pty Ltd
 */

 const {
  isPresent,
  hasContent,
  takesIdForm,
  takesDateForm,
  isNumber,
  isEmail,
  fieldHasContent,
  constructIsOneOf,
  constructRecordExistsWithId,
  constructIsEmptyOr,
  constructIsLongerThan,
  constructIsValidJson,
} = require('./validatorFunctions');

module.exports = {
  ObjectValidator: require('./ObjectValidator'),
  isPresent,
  hasContent,
  takesIdForm,
  takesDateForm,
  isNumber,
  isEmail,
  fieldHasContent,
  constructIsOneOf,
  constructRecordExistsWithId,
  constructIsEmptyOr,
  constructIsLongerThan,
  constructIsValidJson,
};
