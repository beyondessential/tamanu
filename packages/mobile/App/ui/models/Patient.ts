export interface PatientModel {
  [key: string]: any;
  id: string;
  displayId: string;
  city: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  gender: string;
  birthDate: Date;
  bloodType: string;
  lastVisit: Date;
  telephone?: string;
  culturalTraditionName?: string;
}
