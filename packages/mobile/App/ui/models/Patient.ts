
export interface PatientModel {
  [key: string]: any;
  id: string;
  displayId: string;  
  firstName: string;
  lastName: string;
  middleName?: string;  
  sex: string;
  dateOfBirth: Date;      
  culturalName?: string;
}
