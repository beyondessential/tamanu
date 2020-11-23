import { ScheduledVaccine } from '~/models';
import { ID } from './ID';

export interface IAdministeredVaccine {
  id: ID;
  schedule: string;
  category: string;
  scheduledVaccine: ScheduledVaccine;
  batch: string;
  status: string;
  date: Date;
}
