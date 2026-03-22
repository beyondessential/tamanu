export const getCompletedDate = ({ completedDate }, getSetting, { formatShortExplicit }) =>
  completedDate ? formatShortExplicit(completedDate) : 'Unknown';

export const getDateOfSwab = ({ sampleTime }, getSetting, { formatShortExplicit }) =>
  sampleTime ? formatShortExplicit(sampleTime) : 'Unknown';

export const getTimeOfSwab = ({ sampleTime }, getSetting, { formatTime }) =>
  sampleTime ? formatTime(sampleTime) : 'Unknown';

export const getLaboratory = ({ laboratory }, getSetting) =>
  laboratory?.name || getSetting('templates.covidTestCertificate.laboratoryName');

export const getLabMethod = ({ labTestMethod }) => (labTestMethod || {}).name || 'Unknown';

export const getRequestId = ({ displayId }) => displayId || 'Unknown';
