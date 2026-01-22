export const getCompletedDate = ({ completedDate }, _, __, { formatShortExplicit }) =>
  completedDate ? formatShortExplicit(completedDate) : 'Unknown';

export const getDateOfSwab = ({ sampleTime }, _, __, { formatShortExplicit }) =>
  sampleTime ? formatShortExplicit(sampleTime) : 'Unknown';

export const getTimeOfSwab = ({ sampleTime }, _, __, { formatTime }) =>
  sampleTime ? formatTime(sampleTime) : 'Unknown';

export const getLaboratory = ({ laboratory }, _, getSetting) =>
  laboratory?.name || getSetting('templates.covidTestCertificate.laboratoryName');

export const getLabMethod = ({ labTestMethod }) => (labTestMethod || {}).name || 'Unknown';

export const getRequestId = ({ displayId }) => displayId || 'Unknown';
