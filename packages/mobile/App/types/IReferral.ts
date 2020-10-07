import { ID } from './ID';

export interface IReferral {
  id: ID;
  date: Date;
  referredTo: string;
}
