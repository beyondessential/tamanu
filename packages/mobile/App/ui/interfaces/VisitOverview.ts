import { MedicationProps } from './MedicationProps';

export interface VisitOverviewProps {
  id: number;
  type: string;
  typeDescription?: string;
  content: string;
  date: Date;
  location: string;
  diagnosis: string;
  treament: string;
  practitioner: {
    name: string;
  };
  medications: MedicationProps[];
}
