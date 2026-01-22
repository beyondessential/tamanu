export const getCompletedDate = ({ completedDate }, _, { formatShortExplicit }) =>
  completedDate ? formatShortExplicit(completedDate) : 'Unknown';

export const getDateOfSwab = ({ sampleTime }, _, { formatShortExplicit }) =>
  sampleTime ? formatShortExplicit(sampleTime) : 'Unknown';

export const getTimeOfSwab = ({ sampleTime }, _, { formatTime }) =>
  sampleTime ? formatTime(sampleTime) : 'Unknown';

export const getLaboratory = ({ laboratory }, _, getSetting) =>
  laboratory?.name || getSetting('templates.covidTestCertificate.laboratoryName');

export const getLabMethod = ({ labTestMethod }) => (labTestMethod || {}).name || 'Unknown';

export const getRequestId = ({ displayId }) => displayId || 'Unknown';
