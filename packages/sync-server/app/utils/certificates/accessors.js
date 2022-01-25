import moment from 'moment';

export const getCompletedDate = ({ tests }) =>
  tests?.completedDate ? moment(tests.completedDate).format('Do MMM YYYY') : 'Unknown';

export const getDateOfSwab = ({ sampleTime }) =>
  sampleTime ? moment(sampleTime).format('Do MMM YYYY') : 'Unknown';

export const getLaboratory = ({ laboratory }) => laboratory?.name || 'Unknown';

export const getLabMethod = ({ tests }) => tests?.labTestMethod?.name || 'Unknown';

export const getLabOfficer = ({ tests }) => tests?.labTestMethod?.name || 'Unknown';

export const getRequestId = ({ displayId }) => displayId || 'Unknown';
