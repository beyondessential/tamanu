import { ID } from './ID';

export interface IVaccine {
  id: ID;
  name: string;
  code: string;
  schedule: string[];
}
