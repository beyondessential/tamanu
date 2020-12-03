import { VaccineStatus } from '/helpers/constants';

export const givenOnTimeProps = {
  status: VaccineStatus.GIVEN,
  name: 'BCG',
  subtitle: '(Tuberculosis)',
  dateType: 'Birth',
  date: new Date('04/22/2019'),
  type: 'Engerix-B®',
  batch: 'EB155480',
  manufacture: 'Vaccine AJV',
  administered: 'Sarah De connick',
};

export const givenNotOnScheduleProps = {
  status: VaccineStatus.GIVEN_NOT_ON_TIME,
  name: 'BCG',
  subtitle: '(Tuberculosis)',
  dateType: 'Birth',
  reason: 'Not mandatory',
  date: new Date('04/22/2019'),
  type: 'Engerix-B®',
  batch: 'EB155480',
  manufacture: 'Vaccine AJV',
  administered: 'Sarah De connick',
};

export const notGivenProps = {
  status: VaccineStatus.NOT_GIVEN,
  name: 'BCG',
  subtitle: '(Tuberculosis)',
  dateType: 'Birth',
  date: new Date('04/22/2019'),
  administered: 'Sarah De connick',
};
