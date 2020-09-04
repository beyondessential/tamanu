import { VaccineStatus } from '/helpers/constants';

export const takenOnTimeProps = {
  status: VaccineStatus.TAKEN,
  name: 'BCG',
  subtitle: '(Tuberculosis)',
  dateType: 'Birth',
  date: new Date('04/22/2019'),
  type: 'Engerix-B®',
  batch: 'EB155480',
  manufacture: 'Vaccine AJV',
  administered: 'Sarah De connick',
};

export const takenNotOnScheduleProps = {
  status: VaccineStatus.TAKEN_NOT_ON_TIME,
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

export const notTakenProps = {
  status: VaccineStatus.NOT_TAKEN,
  name: 'BCG',
  subtitle: '(Tuberculosis)',
  dateType: 'Birth',
  date: new Date('04/22/2019'),
  administered: 'Sarah De connick',
};
