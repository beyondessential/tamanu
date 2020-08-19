import { ID } from './ID';

export interface IEncounter {
  id: ID;

  patientId: ID;
  departmentId: ID;
  locationId: ID;
  examinerId: ID;

  encounterType: string;

  startDate: Date;
  endDate?: Date;

  reasonForEncounter: string;
}
