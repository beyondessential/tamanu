import { PatientModel } from '/models/Patient';

export type PatientSectionListItem = {
  items: PatientModel[];
  header: string;
};
