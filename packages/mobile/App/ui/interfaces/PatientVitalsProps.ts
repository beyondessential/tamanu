import { AVPUType } from "~/types/IVitals";

export interface PatientVitalsProps {
  height?: number;
  weight?: number;
  temperature?: number;
  sbp?: number;
  dbp?: number;
  heartRate?: number;
  respiratoryRate?: number;
  sv02?: number;
  avpu?: AVPUType;
  date?: Date;
  dateRecorded?: string
}
