
export interface IPatient {
  id: string;
  displayId: string;  
  firstName: string;
  lastName: string;
  middleName?: string;  
  sex: string;
  dateOfBirth: Date;      
  culturalName?: string;
}

