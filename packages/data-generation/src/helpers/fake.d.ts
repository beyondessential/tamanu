export declare const chance: Chance.Chance;
export declare function fakeStringFields(prefix: string, fields: string[]): {};
export declare function fakeScheduledVaccine(prefix?: string): {
    weeksFromBirthDue: number;
    weeksFromLastVaccinationDue: any;
    index: number;
    vaccineId: any;
    visibilityStatus: string;
    sortIndex: number;
};
export declare function fakeSurvey(prefix?: string): {
    programId: any;
    surveyType: string;
    isSensitive: boolean;
};
export declare function fakeSurveyScreenComponent(prefix?: string): {
    surveyId: any;
    dataElementId: any;
    screenIndex: number;
    componentIndex: number;
    options: string;
    calculation: string;
};
export declare function fakeProgramDataElement(prefix?: string): {
    type: string;
};
export declare function fakeReferenceData(prefix?: string): {
    type: string;
    visibilityStatus: string;
};
export declare function fakeUser(prefix?: string): {};
export declare function fakeProgram(prefix?: string): {};
export declare function fakeAdministeredVaccine(prefix: string, scheduledVaccineId: string): {
    encounterId: any;
    scheduledVaccineId: string;
    date: string;
};
export declare function fakeEncounter(prefix?: string): {
    deviceId: any;
    surveyResponses: any[];
    administeredVaccines: any[];
    encounterType: string;
    startDate: string;
    endDate: string;
};
export declare function fakeSurveyResponse(prefix?: string): {
    answers: any[];
    encounterId: any;
    surveyId: any;
    startTime: string;
    endTime: string;
    result: number;
};
export declare function fakeSurveyResponseAnswer(prefix?: string): {
    dataElementId: any;
    responseId: any;
};
export declare function fakeEncounterDiagnosis(prefix?: string): {
    certainty: string;
    date: string;
    isPrimary: boolean;
    encounterId: any;
    diagnosisId: any;
};
export declare function fakeEncounterMedication(prefix?: string): {
    date: string;
    endDate: string;
    qtyMorning: number;
    qtyLunch: number;
    qtyEvening: number;
    qtyNight: number;
};
export declare const fakeDate: () => Date;
export declare const fakeString: (model: any, { fieldName }: {
    fieldName: any;
}, id: string) => string;
export declare const fakeDateTimeString: () => string;
export declare const fakeDateString: () => string;
export declare const fakeInt: () => number;
export declare const fakeFloat: () => number;
export declare const fakeBool: () => boolean;
/**
 *
 * @param {import('@tamanu/database').Model} model
 */
export declare const fake: (model: any, passedOverrides?: Record<string, any>) => Record<string, any>;
