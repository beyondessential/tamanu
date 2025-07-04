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
  schedule: string;
}

export interface OptionalVaccineModalAssertionParams {
  batch?: string;
  injectionSite?: string;
  givenBy?: string;
  brand?: string;
  disease?: string;
  notGivenClinician?: string;
  notGivenReason?: string;
}
