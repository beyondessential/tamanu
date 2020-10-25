import { ReferenceData } from '~/models';
import { ID } from './ID';

export interface IMedication {
  id: ID;
  date: Date;
  endDate: Date;
  prescription: string;
  note: string;
  indication: string;
  route: string;
  quantity: number;
  medication: ReferenceData;
}
