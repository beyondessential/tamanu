export const getCompletedDate = ({ completedDate }, getLocalisation, getSetting, { formatCustom } = {}) =>
  completedDate && formatCustom ? formatCustom(completedDate, 'do MMM yyyy') : 'Unknown';

export const getDateOfSwab = ({ sampleTime }, getLocalisation, getSetting, { formatCustom } = {}) =>
  sampleTime && formatCustom ? formatCustom(sampleTime, 'do MMM yyyy') : 'Unknown';

export const getTimeOfSwab = ({ sampleTime }, getLocalisation, getSetting, { formatTime } = {}) =>
  sampleTime && formatTime ? formatTime(sampleTime) : 'Unknown';

export const getLaboratory = ({ laboratory }, _, getSetting) =>
  laboratory?.name || getSetting('templates.covidTestCertificate.laboratoryName');

export const getLabMethod = ({ labTestMethod }) => (labTestMethod || {}).name || 'Unknown';

export const getRequestId = ({ displayId }) => displayId || 'Unknown';
