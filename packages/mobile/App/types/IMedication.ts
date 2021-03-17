import { ID } from './ID';
import { IReferenceData } from './IReferenceData';

export interface IMedication {
  id: ID;
  date: Date;
  quantity: number;
  medication: IReferenceData;
  endDate?: Date;
  note?: string;
  prescription?: string;
  indication?: string;
  route?: string;
}
