import { ReferenceData } from '~/models';
import { ID } from './ID';

export interface IScheduledVaccine {
  id: ID;
  index: number;
  schedule: string;
  vaccine: ReferenceData;
}
