/**
 * Tupaia MediTrak
 * Copyright (c) 2017 Beyond Essential Systems Pty Ltd
 */

const moment = require('moment');
const validator = require('validator');

exports.isPresent = (value) => {
  if (value === undefined) {
    throw new Error('Even if it has no content, the field should be included in the object');
  }
};

exports.hasContent = (value) => {
  if (value === undefined || value === null || value.length === 0) {
    throw new Error('Should not be empty');
  }
  return true;
};

exports.takesIdForm = (value) => {
  if (value.length !== 24) {
    throw new Error('An id should be 24 characters exactly');
  }
};

exports.takesDateForm = (value) => {
  if (!moment(value, moment.ISO_8601, true).isValid()) {
    throw new Error('Dates should be in ISO 8601 format');
  }
};

exports.isNumber = (value) => {
  if (isNaN(value)) {
    throw new Error(`Should contain a number instead of ${value}`);
  }
};

exports.isEmail = (value) => {
  if (!validator.isEmail(value.toString())) { // Coerce to string before checking with validator
    throw new Error('Not a valid email address');
  }
};

exports.fieldHasContent = (value) => {
  if (value === undefined || value === null || value.length === 0) {
    throw new Error('Please complete all fields.');
  }
  return true;
};

/**
 * Unlike the other validator functions, the constructors below this point take in extra information
 * and return the validation function
 */

exports.constructIsOneOf = (options) => (value) => {
  if (!options.includes(value)) {
    throw new Error(`${value} is not an accepted value`);
  }
};

exports.constructRecordExistsWithId = (database, recordType) => async (value) => {
  hasContent(value);
  takesIdForm(value);
  const record = await database.findById(recordType, value);
  if (!record) {
    throw new Error(`No ${recordType} with id ${value}`);
  }
};

exports.constructIsEmptyOr = (validatorFunction) => (value) => {
  if (value !== undefined && value !== null && value !== '') {
    return validatorFunction(value);
  }
  return true;
};

exports.constructIsLongerThan = (minLength) => (value) => {
  if (value.length < minLength) {
    throw new Error(`Must be longer than ${value} characters`);
  }
};

exports.constructIsValidJson = () => (value) => {
  try {
    JSON.parse(value);
  } catch (exception) {
    throw new Error(`${value} is not valid JSON`);
  }
};
