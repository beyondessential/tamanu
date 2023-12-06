import { getDisplayDate } from './getDisplayDate';

export const getCompletedDate = ({ completedDate }, getLocalisation) =>
  completedDate ? getDisplayDate(completedDate, 'do MMM yyyy', getLocalisation) : 'Unknown';

export const getDateOfSwab = ({ sampleTime }) =>
  sampleTime ? getDisplayDate(sampleTime, 'do MMM yyyy') : 'Unknown';

export const getTimeOfSwab = ({ sampleTime }) => {
  return sampleTime ? getDisplayDate(sampleTime, 'hh:mm a') : 'Unknown';
};

export const getLaboratory = ({ laboratory }, getLocalisation) =>
  (laboratory || {}).name || getLocalisation('templates.covidTestCertificate.laboratoryName');

export const getLabMethod = ({ labTestMethod }) => (labTestMethod || {}).name || 'Unknown';

export const getRequestId = ({ displayId }) => displayId || 'Unknown';
