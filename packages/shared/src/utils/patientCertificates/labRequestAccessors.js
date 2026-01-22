export const getCompletedDate = ({ completedDate }, _getLocalisation, _getSetting, { formatShortExplicit }) =>
  completedDate ? formatShortExplicit(completedDate) : 'Unknown';

export const getDateOfSwab = ({ sampleTime }, _getLocalisation, _getSetting, { formatShortExplicit }) =>
  sampleTime ? formatShortExplicit(sampleTime) : 'Unknown';

export const getTimeOfSwab = ({ sampleTime }, _getLocalisation, _getSetting, { formatTime }) =>
  sampleTime ? formatTime(sampleTime) : 'Unknown';

export const getLaboratory = ({ laboratory }, _getLocalisation, getSetting) =>
  laboratory?.name || getSetting('templates.covidTestCertificate.laboratoryName');

export const getLabMethod = ({ labTestMethod }) => (labTestMethod || {}).name || 'Unknown';

export const getRequestId = ({ displayId }) => displayId || 'Unknown';
