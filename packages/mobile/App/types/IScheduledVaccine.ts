import { VisibilityStatus } from '~/visibilityStatuses';
import { ID } from './ID';
import { IReferenceData } from './IReferenceData';

export interface IScheduledVaccine {
  id: ID;
  index?: number;
  label?: string;
  schedule?: string;
  weeksFromBirthDue?: number;
  weeksFromLastVaccinationDue?: number;
  category?: string;
  vaccine: IReferenceData;
  vaccineId: string;
  visibilityStatus: VisibilityStatus;
}
