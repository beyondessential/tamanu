import { capitalize } from 'lodash';
import { getDisplayDate } from './patientCertificates/getDisplayDate';
import { ageInYears, formatShort } from './dateTime';

export const getName = ({ firstName, lastName }) => `${firstName} ${lastName}`;
export const getSex = ({ sex }) => `${capitalize(sex)}`;

export const getDOB = ({ dateOfBirth }, getLocalisation, getTranslation) =>
  dateOfBirth
    ? getDisplayDate(dateOfBirth, 'dd/MM/yyyy', getLocalisation)
    : getTranslation('general.fallback.unknown', 'Unknown');

export const getDOBWithAge = ({ dateOfBirth }, { getTranslation }) => {
  if (!dateOfBirth) return getTranslation('general.fallback.unknown', 'Unknown');

  const dob = formatShort(dateOfBirth);
  const age = ageInYears(dateOfBirth);

  // TODO
  return `${dob} (${age} years)`;
};

export const getDateOfDeath = ({ dateOfDeath }, { getLocalisation, getTranslation }) => {
  if (!dateOfDeath) return getTranslation('general.fallback.unknown', 'Unknown');
  return getDisplayDate(dateOfDeath, 'd MMM yyyy', getLocalisation);
};

export const getTimeOfDeath = ({ dateOfDeath }, { getLocalisation, getTranslation }) => {
  if (!dateOfDeath) return getTranslation('general.fallback.unknown', 'Unknown');
  return getDisplayDate(dateOfDeath, 'hh:mma', getLocalisation).toLowerCase();
};

export const getPlaceOfBirth = ({ additionalData }) => (additionalData || {}).placeOfBirth;

export const getNationality = ({ additionalData }) =>
  ((additionalData || {}).nationality || {}).name;

export const getPassportNumber = ({ additionalData }) => (additionalData || {}).passport;

export const getAddress = ({ additionalData }, { getTranslation }) => {
  let address = getTranslation('general.fallback.notApplicable', 'N/A');

  const { streetVillage, cityTown, country } = additionalData || {};

  if (streetVillage && cityTown && country) {
    address = `${streetVillage}, ${cityTown}, ${country.name}`;
  }

  return address;
};

export const getLocationName = ({ location }) =>
  location.locationGroup ? `${location.locationGroup.name}, ${location.name}` : location.name;

export const getVillageName = ({ village }) => village?.name;

export const getPatientWeight = ({ patientWeight }, {getTranslation}) =>
  patientWeight
    ? `${patientWeight}${getTranslation('general.localisedField.weightUnit.label', 'kg')}`
    : '';

export const getEthnicity = ({ additionalData }) => additionalData?.ethnicity?.name;

export const getClinician = ({ clinician }) => clinician?.displayName;
