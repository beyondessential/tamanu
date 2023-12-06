import { capitalize } from 'lodash';
import { getDisplayDate } from './patientCertificates/getDisplayDate';

export const getName = ({ firstName, lastName }) => `${firstName} ${lastName}`;
export const getSex = ({ sex }) => `${capitalize(sex)}`;

export const getDOB = ({ dateOfBirth }, getSetting) =>
  dateOfBirth
    ? getDisplayDate(dateOfBirth, 'dd/MM/yyyy', getSetting('countryTimeZone'))
    : 'Unknown';

export const getPlaceOfBirth = ({ additionalData }) => (additionalData || {}).placeOfBirth;

export const getNationality = ({ additionalData }) =>
  ((additionalData || {}).nationality || {}).name;

export const getPassportNumber = ({ additionalData }) => (additionalData || {}).passport;
