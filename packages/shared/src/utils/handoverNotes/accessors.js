import { capitalize } from 'lodash';
import { getDisplayDate } from '../patientCertificates/getDisplayDate';

export const getName = ({ firstName, lastName }) => `${firstName} ${lastName}`;
export const getSex = ({ sex }) => `${capitalize(sex)}`;

export const getDOB = ({ dateOfBirth }, getLocalisation) =>
  dateOfBirth ? getDisplayDate(dateOfBirth, 'dd/MM/yyyy', getLocalisation) : 'Unknown';
