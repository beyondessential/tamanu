import { ID } from './ID';
import { IReferenceData } from './IReferenceData';

export interface IScheduledVaccine {
  id: ID;
  index?: number;
  label: string;
  schedule: string;
  weeksFromBirthDue?: number;
  category: string;
  vaccine: IReferenceData;
}
