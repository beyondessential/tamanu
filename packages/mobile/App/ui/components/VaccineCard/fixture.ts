import { VaccineStatus } from "~/ui/helpers/patient";

export const givenOnTimeProps = {
  status: VaccineStatus.GIVEN,
  name: 'BCG',
  subtitle: '(Tuberculosis)',
  dateType: 'Birth',
  date: new Date('04/22/2019'),
  type: 'Engerix-B®',
  batch: 'EB155480',
  manufacture: 'Vaccine AJV',
};

export const notGivenProps = {
  status: VaccineStatus.NOT_GIVEN,
  name: 'BCG',
  subtitle: '(Tuberculosis)',
  dateType: 'Birth',
  date: new Date('04/22/2019'),
};
