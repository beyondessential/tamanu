export interface VaccineModel {
    name: string;
    subtitle: string;
    date: Date;
    status: string;
    type?: string;
    manufacture?: string;
    batch?: string;
    reason?: string;
    administered?: string;
}
