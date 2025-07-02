export interface RequiredVaccineModalAssertionParams {
    vaccineName: string;
    date: string;
    area: string;
    location: string;
    department: string;
    given: boolean;
    count: number;
    category: 'Routine' | 'Catchup' | 'Campaign' | 'Other';
    fillOptionalFields: boolean;
  }
  
export interface OptionalVaccineModalAssertionParams {
    batch?: string;
    schedule?: string;
    injectionSite?: string;
    givenBy?: string;
    brand?: string;
    disease?: string;
    notGivenClinician?: string;
    notGivenReason?: string;
  }