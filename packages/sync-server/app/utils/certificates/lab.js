import moment from 'moment';

export const getRequestId = ({ displayId }) => displayId;

export const getLaboratory = ({ laboratoryName, laboratory }) =>
  laboratoryName || (laboratory || {}).name || 'Unknown';

export const getCompletedDate = ({ completedDate }) => moment(completedDate).format('Do MMM YYYY');
export const getMethod = ({ labTestMethod }) => (labTestMethod || {}).name || 'Unknown';
