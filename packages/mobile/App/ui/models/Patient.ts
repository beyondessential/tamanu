import { Gender } from "../helpers/constants";

export interface PatientModel {
  [key: string]: any;
  id: string;
  displayId: string;  
  firstName: string;
  lastName: string;
  middleName?: string;  
  gender: Gender;
  birthDate: Date;      
  culturalTraditionName?: string;
}
