import { ID } from './ID';
import { IReferenceData } from './IReferenceData';

export interface IMedication {
  id: ID;
  date: string;
  quantity: number;
  medication: IReferenceData;
  endDate?: string;
  note?: string;
  prescription?: string;
  indication?: string;
  route?: string;
}
