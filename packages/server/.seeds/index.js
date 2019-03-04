const request = require('request-promise');
const shortid = require('shortid');

const users = require('./users');
const views = require('./views');
const userRoles = require('./user-roles');
const programs = require('./programs');
const tests = require('./tests');
const patients = require('./patients');
const imagingTypes = require('./imaging-types');
const diagnoses = require('./diagnoses');
const drugs= require('./drugs');

module.exports = async (database) => {
  views(database);
  userRoles(database);
  users(database);
  programs(database);
  tests(database);
  await patients(database);
  imagingTypes(database);
  diagnoses(database);
  await drugs(database);
}
