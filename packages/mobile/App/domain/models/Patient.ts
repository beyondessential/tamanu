export interface PatientModel {
  [key: string]: any;
  id: string | number;
  city: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  sex: string;
  dateOfBirth: Date;
  bloodType: string;
  lastVisit: Date;
  telephone?: string;
  culturalTraditionName?: string;
}
