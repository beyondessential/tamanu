import moment from 'moment';

export const getCompletedDate = ({ tests }) =>
  tests?.completedDate ? moment(tests.completedDate).format('Do MMM YYYY') : 'Unknown';

export const getDateOfSwab = ({ sampleTime }) =>
  sampleTime ? moment(sampleTime).format('Do MMM YYYY') : 'Unknown';

export const getLaboratory = ({ laboratory }) => laboratory?.name || 'Unknown';

export const getLabMethod = ({ tests }) => tests?.labTestMethod?.name || 'Unknown';

export const getRequestId = ({ displayId }) => displayId || 'Unknown';

export const getDOB = ({ dateOfBirth }) => {
  console.log('dob', dateOfBirth);
  return dateOfBirth ? moment(dateOfBirth).format('Do MMM YYYY') : 'Unknown';
};

export const getDisplayDate = date => moment(date).format('DD/MM/YYYY');

export const getPlaceOfBirth = ({ additionalData }) => additionalData?.placeOfBirth;

export const getNationality = ({ additionalData }) => additionalData?.nationality?.name;

export const getPassportNumber = ({ additionalData }) => additionalData?.passport;
