//TODO: I set this up for edit, refactor for create?
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
}
/*
possible extras
    category: 'Routine' | 'Catchup' | 'Campaign' | 'Other';
    fillOptionalFields: boolean;
    schedule: string;
    brand?: string;
    disease?: string;
    notGivenClinician?: string;
    notGivenReason?: string;
*/