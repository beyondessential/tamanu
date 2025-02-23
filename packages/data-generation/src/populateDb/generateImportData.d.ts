import type { Department, Facility, InvoiceProduct, LabTestType, Location, LocationGroup, Models, ProgramRegistry, ReferenceData, ScheduledVaccine, Survey, User } from '@tamanu/database';
export declare const generateImportData: ({ ReferenceData, ReferenceDataRelation, Facility, LocationGroup, Location, Department, Survey, SurveyScreenComponent, ScheduledVaccine, ProgramDataElement, Program, ProgramRegistry, ProgramRegistryCondition, ProgramRegistryClinicalStatus, InvoiceProduct, LabTestType, User, }: Models) => Promise<{
    referenceData: ReferenceData;
    facility: Facility;
    department: Department;
    locationGroup: LocationGroup;
    location: Location;
    survey: Survey;
    scheduledVaccine: ScheduledVaccine;
    invoiceProduct: InvoiceProduct;
    labTestType: LabTestType;
    user: User;
    programRegistry: ProgramRegistry;
}>;
