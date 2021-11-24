import moment from 'moment';

export const getAgeFromDOB = dob => (dob ? moment().diff(moment(dob), 'years') : '');
