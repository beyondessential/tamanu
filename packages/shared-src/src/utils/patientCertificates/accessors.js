import { getDisplayDate } from './getDisplayDate';

export const getCompletedDate = ({ tests }) =>
  tests?.completedDate ? getDisplayDate(tests.completedDate, 'Do MMM YYYY') : 'Unknown';

export const getDateOfSwab = ({ sampleTime }) =>
  sampleTime ? getDisplayDate(sampleTime, 'Do MMM YYYY') : 'Unknown';

export const getDOB = ({ dateOfBirth }) =>
  dateOfBirth ? getDisplayDate(dateOfBirth, 'Do MMM YYYY') : 'Unknown';

export const getLaboratory = ({ laboratory }) => laboratory?.name || 'Unknown';

export const getLabMethod = ({ tests }) => tests?.labTestMethod?.name || 'Unknown';

export const getRequestId = ({ displayId }) => displayId || 'Unknown';

export const getPlaceOfBirth = ({ additionalData }) => additionalData?.placeOfBirth;

export const getNationality = ({ additionalData }) => additionalData?.nationality?.name;

export const getPassportNumber = ({ additionalData }) => additionalData?.passport;
