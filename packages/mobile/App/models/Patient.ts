export interface PatientModel {
    [key:string]: any;
    id: string | number;
    city: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    gender: string;
    birthDate: Date;
    bloodType: string;
    lastVisit: Date;
}
