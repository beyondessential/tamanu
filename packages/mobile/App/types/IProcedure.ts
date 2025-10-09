import { IDepartment } from './IDepartment';
import { IEncounter } from './IEncounter';
import { ILocation } from './ILocation';
import { IReferenceData } from './IReferenceData';
import { IUser } from './IUser';

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
