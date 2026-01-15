import { capitalize } from 'lodash';
import { ageInYears } from '@tamanu/utils/dateTime';
import { getDisplayAge } from '@tamanu/utils/date';

export const getName = ({ firstName, lastName }) => `${firstName} ${lastName}`;
export const getSex = ({ sex }) => `${capitalize(sex)}`;

export const getDob = ({ dateOfBirth }, { getTranslation, formatShort }) =>
  dateOfBirth && formatShort
    ? formatShort(dateOfBirth)
    : getTranslation('general.fallback.unknown', 'Unknown');

export const getDobWithAge = ({ dateOfBirth }, { getTranslation, getSetting, formatShort }) => {
  if (!dateOfBirth) return getTranslation('general.fallback.unknown', 'Unknown');

  const dob = formatShort(dateOfBirth);
  const ageDisplayFormat = getSetting ? getSetting('ageDisplayFormat') : null;
  const age = ageDisplayFormat ? getDisplayAge(dateOfBirth, ageDisplayFormat) : `${ageInYears(dateOfBirth)} ${getTranslation('dateTime.unit.years', 'years')}`;

  return `${dob} (${age})`;
};

export const getDateOfDeath = ({ dateOfDeath }, { getTranslation, formatCustom }) => {
  if (!dateOfDeath) return getTranslation('general.fallback.unknown', 'Unknown');
  return formatCustom ? formatCustom(dateOfDeath, 'd MMM yyyy') : dateOfDeath;
};

export const getTimeOfDeath = ({ dateOfDeath }, { getTranslation, formatTime }) => {
  if (!dateOfDeath) return getTranslation('general.fallback.unknown', 'Unknown');
  return formatTime ? formatTime(dateOfDeath) : dateOfDeath;
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
