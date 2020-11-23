import { ID } from './ID';
import { IScheduledVaccine } from './IScheduledVaccine';

export interface IAdministeredVaccine {
  id: ID;
  schedule: string;
  category: string;
  scheduledVaccine: IScheduledVaccine;
  batch: string;
  status: string;
  date: Date;
}
