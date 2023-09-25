import { getDisplayDate } from './getDisplayDate';

export const getCompletedDate = ({ completedDate }, getSetting) =>
  completedDate
    ? getDisplayDate(completedDate, 'do MMM yyyy', getSetting('countryTimeZone'))
    : 'Unknown';

export const getDateOfSwab = ({ sampleTime }) =>
  sampleTime ? getDisplayDate(sampleTime, 'do MMM yyyy') : 'Unknown';

export const getTimeOfSwab = ({ sampleTime }) => {
  return sampleTime ? getDisplayDate(sampleTime, 'hh:mm a') : 'Unknown';
};

export const getLaboratory = ({ laboratory }, getSetting) =>
  (laboratory || {}).name || getSetting('templates.covidTestCertificate.laboratoryName');

export const getLabMethod = ({ labTestMethod }) => (labTestMethod || {}).name || 'Unknown';

export const getRequestId = ({ displayId }) => displayId || 'Unknown';
