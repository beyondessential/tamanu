import { VaccineModel } from '../models/Vaccine';

export interface PatientVaccineProps {
  [key: string]: string | VaccineModel | null;
  bcg: VaccineModel | null;
  hepb: VaccineModel | null;
  dpt: VaccineModel | null;
  pcv: VaccineModel | null;
  ipv: VaccineModel | null;
  mr: VaccineModel | null;
  tt: VaccineModel | null;
}
