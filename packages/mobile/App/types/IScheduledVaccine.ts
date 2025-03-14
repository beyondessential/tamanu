import { VisibilityStatus } from '~/visibilityStatuses';
import { ID } from './ID';
import { IReferenceData } from './IReferenceData';

export interface IScheduledVaccine {
  id: ID;
  index?: number;
  label?: string;
  doseLabel?: string;
  weeksFromBirthDue?: number;
  weeksFromLastVaccinationDue?: number;
  category?: string;
  vaccine: IReferenceData;
  vaccineId: string;
  hideFromCertificate: boolean;
  visibilityStatus: VisibilityStatus;
  sortIndex: number;
}
