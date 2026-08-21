import type { IDepartment } from './IDepartment';
import type { IEncounter } from './IEncounter';
import type { ILocation } from './ILocation';
import type { IReferenceData } from './IReferenceData';
import type { IUser } from './IUser';

export interface IProcedure {
  id: string;
  completed: boolean;
  date: string;
  endTime?: string;
  startTime?: string;
  note?: string;
  completedNote?: string;
  timeIn?: string;
  timeOut?: string;
  encounterId?: string;
  locationId?: string;
  procedureTypeId?: string;
  leadClinicianId?: string;
  anaesthetistId?: string;
  anaestheticId?: string;
  departmentId?: string;
  assistantAnaesthetistId?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  updatedAtSyncTick: number;
  // Relation properties
  encounter?: IEncounter;
  location?: ILocation;
  procedureType?: IReferenceData;
  leadClinician?: IUser;
  anaesthetist?: IUser;
  anaesthetic?: IReferenceData;
  department?: IDepartment;
  assistantAnaesthetist?: IUser;
}
