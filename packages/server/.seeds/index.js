import users from './users';
import userRoles from './user-roles';
import programs from './programs';
import tests from './tests';
import patients from './patients';
import imagingTypes from './imaging-types';
import diagnoses from './diagnoses';
import drugs from './drugs';

// TODO: update seed to work with non-db level change detection
export default async (database) => {
  userRoles(database);
  users(database);
  programs(database);
  tests(database);
  await patients(database);
  imagingTypes(database);
  diagnoses(database);
  await drugs(database);
}
