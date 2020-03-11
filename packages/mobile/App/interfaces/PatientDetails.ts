
export interface OperativePlanDataProps {
    operativePlan: {
        data: string[];
    }
}


export interface FamilyHistoryDataProps {
    familyHistory: {
        data: string[];
    }
}

export interface OnGoingConditionsDataProps {
    ongoingConditions: {
        data: string[];
    }
}

export interface PatientParentsDataProps {
    parentsInfo: {
        motherName?: string;
        fatherName?: string;
    }
}

export interface ReminderWarnings {
    reminderWarnings: boolean
}

export interface PatientGeneralInformationDataProps {
    id: string;
    generalInfo: {
        firstName: string,
        middleName?: string | null,
        lastName: string,
        culturalTraditionName?: string | null
        birthDate: Date,
        bloodType: string
    }
}


export type PatientDetails =
    PatientGeneralInformationDataProps
    & ReminderWarnings
    & PatientParentsDataProps
    & OnGoingConditionsDataProps
    & FamilyHistoryDataProps
    & OperativePlanDataProps
