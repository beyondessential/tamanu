import { ReferenceData } from '~/models';
import { ID } from './ID';

export interface IMedication {
  id: ID;
  date: Date;
  quantity: number;
  medication: ReferenceData;
  endDate?: Date;
  note?: string;
  prescription?: string;
  indication?: string;
  route?: string;
}
