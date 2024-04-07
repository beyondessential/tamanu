import { capitalize } from 'lodash';
import { getDisplayDate } from './patientCertificates/getDisplayDate';
import { ageInYears } from './dateTime';

export const getName = ({ firstName, lastName }) => `${firstName} ${lastName}`;
export const getSex = ({ sex }) => `${capitalize(sex)}`;

export const getDOB = ({ dateOfBirth }, getLocalisation) =>
  dateOfBirth ? getDisplayDate(dateOfBirth, 'dd/MM/yyyy', getLocalisation) : 'Unknown';

export const getDOBWithAge = ({ dateOfBirth }, getLocalisation) => {
  if (!dateOfBirth) return 'Unknown';

  const dob = getDisplayDate(dateOfBirth, 'dd/MM/yyyy', getLocalisation);
  const age = ageInYears(dateOfBirth);
  return `${dob} (${age} years)`;
};

export const getDateOfDeath = ({ dateOfDeath }, getLocalisation) => {
  if (!dateOfDeath) return 'Unknown';
  return getDisplayDate(dateOfDeath, 'd MMM yyyy', getLocalisation);
};

export const getTimeOfDeath = ({ dateOfDeath }, getLocalisation) => {
  if (!dateOfDeath) return 'Unknown';
  return getDisplayDate(dateOfDeath, 'hh:mma', getLocalisation).toLowerCase();
};

export const getPlaceOfBirth = ({ additionalData }) => (additionalData || {}).placeOfBirth;

export const getNationality = ({ additionalData }) =>
  ((additionalData || {}).nationality || {}).name;

export const getPassportNumber = ({ additionalData }) => (additionalData || {}).passport;

export const getAddress = ({ additionalData }) => {
  let address = 'N/A';

  const { streetVillage, cityTown, country } = additionalData || {};

  if (streetVillage && cityTown && country) {
    address = `${streetVillage}, ${cityTown}, ${country.name}`;
  }

  return address;
};

export const getLocationName = ({ location }) =>
  location.locationGroup ? `${location.locationGroup.name}, ${location.name}` : location.name;

export const getVillageName = ({ village }) => village?.name;
