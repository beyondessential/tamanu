import config from 'config';
import moment from 'moment-timezone';
import { log } from 'shared/services/logging';

export const getCompletedDate = ({ tests }) =>
  tests?.completedDate ? moment(tests.completedDate).format('Do MMM YYYY') : 'Unknown';

export const getDateOfSwab = ({ sampleTime }) =>
  sampleTime ? moment(sampleTime).format('Do MMM YYYY') : 'Unknown';

export const getLaboratory = ({ laboratory }) => laboratory?.name || 'Unknown';

export const getLabMethod = ({ tests }) => tests?.labTestMethod?.name || 'Unknown';

export const getRequestId = ({ displayId }) => displayId || 'Unknown';

export const getDOB = ({ dateOfBirth }) => {
  if (!dateOfBirth) {
    return 'Unknown';
  }
  return dateOfBirth ? getDisplayDate(dateOfBirth) : 'Unknown';
};

const DATE_FORMAT = 'Do MMM YYYY';

export const getDisplayDate = date => {
  const { timeZone } = config?.localisation;

  if (timeZone) {
    log.debug(`Display date: ${date} with configured time zone: ${timeZone}.`);

    return moment(date)
      .tz(timeZone)
      .format(DATE_FORMAT);
  }

  return moment(date).format(DATE_FORMAT);
};

export const getPlaceOfBirth = ({ additionalData }) => additionalData?.placeOfBirth;

export const getNationality = ({ additionalData }) => additionalData?.nationality?.name;

export const getPassportNumber = ({ additionalData }) => additionalData?.passport;
