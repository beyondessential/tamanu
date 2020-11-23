import { ReferenceData } from '~/models';
import { ID } from './ID';

export interface IScheduledVaccine {
  id: ID;
  index: number;
  label: string;
  schedule: string;
  category: string;
  vaccine: ReferenceData;
}
