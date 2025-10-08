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
  encounter?: any;
  location?: any;
  procedureType?: any;
  leadClinician?: any;
  anaesthetist?: any;
  anaesthetic?: any;
  department?: any;
  assistantAnaesthetist?: any;
}
