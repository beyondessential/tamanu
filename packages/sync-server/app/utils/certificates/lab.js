import moment from 'moment';

export const getRequestId = ({ displayId }) => displayId;

export const getLaboratory = ({ laboratory }) => laboratory.name || 'Unknown';

export const getCompletedDate = ({ tests }) =>
  tests.completedDate ? moment(tests.completedDate).format('Do MMM YYYY') : 'Unknown';

export const getMethod = ({ tests }) => tests.labTestMethod.name || 'Unknown';
