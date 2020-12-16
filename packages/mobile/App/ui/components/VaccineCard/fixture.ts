import { ScheduledVaccineStatus } from "~/ui/helpers/patient";

export const givenOnTimeProps = {
  status: ScheduledVaccineStatus.GIVEN,
  name: 'BCG',
  subtitle: '(Tuberculosis)',
  dateType: 'Birth',
  date: new Date('04/22/2019'),
  type: 'Engerix-B®',
  batch: 'EB155480',
  manufacture: 'Vaccine AJV',
  administered: 'Sarah De connick',
};

export const notGivenProps = {
  status: ScheduledVaccineStatus.NOT_GIVEN,
  name: 'BCG',
  subtitle: '(Tuberculosis)',
  dateType: 'Birth',
  date: new Date('04/22/2019'),
  administered: 'Sarah De connick',
};
