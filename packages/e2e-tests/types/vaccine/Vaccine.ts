/**
 * Vaccine interface for the patient vaccine record
 * @param vaccineName - The name of the vaccine, e.g. "BCG"
 * @param scheduleOption - The schedule option of the vaccine, e.g. "1st dose"
 * @param given - Whether the vaccine was given, e.g. true
 * @param givenStatus - The status of the vaccine, e.g. "Given"
 * @param category - The category of the vaccine, e.g. "Routine"
 * @param count - The number of vaccines that have been added so far for that specific test, e.g. 1
 * @param area - The area where the vaccine was given, e.g. "Ward 5"
 * @param location - The location where the vaccine was given, e.g. "Bed 1"
 * @param department - The department where the vaccine was given, e.g. "Public Health"
 * @param dateGiven - The date the vaccine was given, e.g. "2021-01-01"
 * @param fillOptionalFields - Whether the optional fields should be filled, e.g. true
 * @param batch - The batch number of the vaccine, e.g. "123456"
 * @param injectionSite - The injection site of the vaccine, e.g. "Left arm"
 * @param givenBy - The name of the clinician who gave the vaccine, e.g. "Dr. John Doe"
 * @param consentGivenBy - The identity of the person who gave consent for the vaccine, e.g. "Recipient"
 * @param brand - The brand of the vaccine, e.g. "Pfizer"
 * @param disease - The disease the vaccine was given for, e.g. "Tuberculosis"
 * @param notGivenClinician - The name of the clinician who did not give the vaccine, e.g. "Dr. John Doe"
 * @param notGivenReason - The reason the vaccine was not given, e.g. "Patient refused"
 */
export interface Vaccine {
  vaccineName: string;
  scheduleOption: string;
  given: boolean;
  givenStatus: string;
  category: 'Routine' | 'Catchup' | 'Campaign' | 'Other';
  count: number;
  area: string;
  location: string;
  department: string;
  dateGiven: string;
  fillOptionalFields?: boolean;
  batch?: string;
  injectionSite?: string;
  givenBy?: string;
  consentGivenBy?: string;
  brand?: string;
  disease?: string;
  notGivenClinician?: string;
  notGivenReason?: string;
  givenElsewhereReason?: string;
  givenElsewhereCountry?: string;
}
