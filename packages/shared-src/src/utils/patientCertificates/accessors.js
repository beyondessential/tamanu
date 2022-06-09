import { getDisplayDate } from './getDisplayDate';

export const getCompletedDate = ({ completedDate }, getLocalisation) =>
  completedDate ? getDisplayDate(completedDate, 'Do MMM YYYY', getLocalisation) : 'Unknown';

export const getDateOfSwab = ({ sampleTime }, getLocalisation) =>
  sampleTime ? getDisplayDate(sampleTime, 'Do MMM YYYY', getLocalisation) : 'Unknown';

export const getTimeOfSwab = ({ sampleTime }, getLocalisation) =>
  sampleTime ? getDisplayDate(sampleTime, 'hh:mm a', getLocalisation) : 'Unknown';

export const getDOB = ({ dateOfBirth }, getLocalisation) =>
  dateOfBirth ? getDisplayDate(dateOfBirth, 'Do MMM YYYY', getLocalisation) : 'Unknown';

export const getLaboratory = ({ laboratory }, getLocalisation) =>
  laboratory?.name || getLocalisation('templates.covidTestCertificate.laboratoryName');

export const getLabMethod = ({ labTestMethod }) => labTestMethod?.name || 'Unknown';

export const getRequestId = ({ displayId }) => displayId || 'Unknown';

export const getPlaceOfBirth = ({ additionalData }) => additionalData?.placeOfBirth;

export const getNationality = ({ additionalData }) => additionalData?.nationality?.name;

export const getPassportNumber = ({ additionalData }) => additionalData?.passport;
