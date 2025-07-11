//TODO: I set this up for edit, refactor for create?
export interface Vaccine {
    vaccineName: string;
    scheduleOption: string;
    batch?: string;
    dateGiven?: string;
    injectionSite?: string;
    area?: string;
    location?: string;
    department?: string;
    givenBy?: string;
    consentGivenBy?: string;
    given?: boolean;
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