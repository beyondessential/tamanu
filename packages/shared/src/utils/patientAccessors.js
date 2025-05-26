import { capitalize } from 'lodash';
import { getDisplayDate } from './patientCertificates/getDisplayDate';
import { ageInYears, formatShort } from '@tamanu/utils/dateTime';

export const getName = ({ firstName, lastName }) => `${firstName} ${lastName}`;
export const getSex = ({ sex }) => `${capitalize(sex)}`;

export const getDob = ({ dateOfBirth }, { getLocalisation, getTranslation }) =>
  dateOfBirth
    ? getDisplayDate(dateOfBirth, 'dd/MM/yyyy', getLocalisation)
    : getTranslation('general.fallback.unknown', 'Unknown');

export const getDobWithAge = ({ dateOfBirth }, { getTranslation }) => {
  if (!dateOfBirth) return getTranslation('general.fallback.unknown', 'Unknown');

  const dob = formatShort(dateOfBirth);
  const age = ageInYears(dateOfBirth);

  return `${dob} (${age} ${getTranslation('dateTime.unit.years', 'years')})`;
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
  const { streetVillage, cityTown, country } = additionalData ?? {};
  if (streetVillage && cityTown && country) {
    return `${streetVillage}, ${cityTown}, ${country.name}`;
  }

  return getTranslation('general.fallback.notApplicable', 'N/A');
};

export const getLocationName = ({ location }) =>
  location.locationGroup ? `${location.locationGroup.name}, ${location.name}` : location.name;

export const getVillageName = ({ village }) => village?.name;

export const getPatientWeight = ({ patientWeight }, { getTranslation }) =>
  patientWeight
    ? `${patientWeight}${getTranslation('general.localisedField.weightUnit.label', 'kg')}`
    : '';

export const getEthnicity = ({ additionalData }) => additionalData?.ethnicity?.name;

export const getClinician = ({ clinician }) => clinician?.displayName;

export const getVillage = ({ village }) => village?.name;
