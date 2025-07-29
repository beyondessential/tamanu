export interface Patient {
  id?: string;
  firstName: string;
  lastName: string;
  nhn: string;
  sex?: string;
  gender?: string;
  dateOfBirth?: string;
  formattedDOB?: string;
  village?: string;
  culturalName?: string;
  displayId?: string;
}

export interface RecentlyViewedPatient {
  name: string;
  nhn: string;
  gender: string;
  birthDate: string;
} 