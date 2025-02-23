import type { Models, Encounter, Patient } from '@tamanu/database';
interface CreateSurveyResponseDataParams {
    models: Models;
    encounterId: string;
    surveyId: string;
}
export declare const createSurveyResponseData: ({ models: { SurveyResponse }, encounterId, surveyId, }: CreateSurveyResponseDataParams) => Promise<void>;
interface CreateDbReportDataParams {
    models: Models;
    userId: string;
}
export declare const createDbReportData: ({ models: { ReportDefinition, ReportDefinitionVersion }, userId, }: CreateDbReportDataParams) => Promise<void>;
interface CreateAdministeredVaccineDataParams {
    models: Models;
    scheduledVaccineId: string;
    encounterId: string;
}
export declare const createAdministeredVaccineData: ({ models: { AdministeredVaccine }, scheduledVaccineId, encounterId, }: CreateAdministeredVaccineDataParams) => Promise<void>;
interface CreateImagingRequestDataParams {
    models: Models;
    userId: string;
    encounterId: string;
    locationGroupId: string;
}
export declare const createImagingRequestData: ({ models: { ImagingRequest, ImagingResult }, userId, encounterId, locationGroupId, }: CreateImagingRequestDataParams) => Promise<void>;
interface CreateProgramRegistryDataParams {
    models: Models;
    userId: string;
    patientId: string;
    programRegistryId: string;
}
export declare const createProgramRegistryData: ({ models: { PatientProgramRegistration, PatientProgramRegistrationCondition }, userId, patientId, programRegistryId, }: CreateProgramRegistryDataParams) => Promise<void>;
interface CreateAppointmentDataParams {
    models: Models;
    locationGroupId: string;
    patientId: string;
    clinicianId: string;
}
export declare const createAppointmentData: ({ models: { AppointmentSchedule, Appointment }, locationGroupId, patientId, clinicianId, }: CreateAppointmentDataParams) => Promise<void>;
interface CreateInvoiceDataParams {
    models: Models;
    encounterId: string;
    userId: string;
    referenceDataId: string;
    productId: string;
}
export declare const createInvoiceData: ({ models: { Invoice, InvoiceDiscount, InvoiceInsurer, InvoicePayment, InvoiceInsurerPayment, InvoicePatientPayment, InvoiceItemDiscount, InvoiceItem, }, encounterId, userId, referenceDataId, productId, }: CreateInvoiceDataParams) => Promise<void>;
interface CreateLabRequestDataParams {
    models: Models;
    departmentId: string;
    userId: string;
    encounterId: string;
    referenceDataId: string;
    patientId: string;
    labTestTypeId: string;
}
export declare const createLabRequestData: ({ models: { LabRequest, LabRequestLog, LabTest, CertificateNotification }, departmentId, userId, encounterId, referenceDataId, patientId, labTestTypeId, }: CreateLabRequestDataParams) => Promise<void>;
interface CreateEncounterDataParams {
    models: Models;
    patientId: string;
    departmentId: string;
    locationId: string;
    userId: string;
    referenceDataId: string;
}
export declare const createEncounterData: ({ models: { Encounter, EncounterHistory, Note, Discharge, EncounterDiagnosis }, patientId, departmentId, locationId, userId, referenceDataId, }: CreateEncounterDataParams) => Promise<{
    encounter: Encounter;
}>;
interface CreatePatientDataParams {
    models: Models;
    facilityId: string;
    userId: string;
}
export declare const createPatientData: ({ models: { Patient, PatientBirthData, PatientAllergy, PatientAdditionalData, PatientDeathData, PatientCommunication, }, facilityId, userId, }: CreatePatientDataParams) => Promise<{
    patient: Patient;
}>;
interface CreateTaskingDataParams {
    models: Models;
    encounterId: string;
    userId: string;
    referenceDataId: string;
}
export declare const createTaskingData: ({ models: { Task, TaskDesignation, TaskTemplate, TaskTemplateDesignation, UserDesignation }, encounterId, userId, referenceDataId, }: CreateTaskingDataParams) => Promise<void>;
export {};
