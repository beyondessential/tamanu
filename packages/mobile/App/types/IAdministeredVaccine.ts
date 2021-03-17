import { ID } from './ID';
import { IScheduledVaccine } from './IScheduledVaccine';

export interface IAdministeredVaccine {
  id: ID;
  location?: string;
  reason?: string;
  scheduledVaccine?: IScheduledVaccine;
  batch?: string;
  status: string;
  date: Date;
}
