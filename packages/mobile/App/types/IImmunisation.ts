import { ID } from './ID';

export interface IImmunisation {
  id: ID;
  schedule: string;
  vaccine: string;
  batch: string;
  timeliness: string;
  date: Date;
}
