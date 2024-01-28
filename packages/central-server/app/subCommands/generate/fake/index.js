import { Command } from 'commander';

import {
    REPORT_STATUSES,
} from '@tamanu/constants';
import { closeDatabase, initDatabase } from '../../../database';

export async function generateFake() {
    const store = await initDatabase({ testMode: false });
    await generateData(store.sequelize.models);
    await closeDatabase();
}

export async function generateData(models) {
    const { Department, Encounter, Facility, Location, EncounterHistory,
        Patient, User, Note, PatientBirthData, SurveyScreenComponent, ReportDefinition,
        ReportDefinitionVersion, LabRequestLog, LabRequest, UserPreference,
        ProgramDataElement } = models;

    const examiner = await User.create(fake(User));
    const patient = await Patient.create(fake(Patient));
    const facility = await Facility.create(fake(Facility));
    const department = await Department.create(
        fake(Department, {
            facilityId: facility.id,
        }),
    );
    const location = await Location.create(
        fake(Location, {
            facilityId: facility.id,
        }),
    );
    const encounter = await Encounter.create(
        fake(Encounter, {
            patientId: patient.id,
            departmentId: department.id,
            locationId: location.id,
            examinerId: examiner.id,
            startDate: '2023-12-21T04:59:51.851Z',
        }),
    );
    await EncounterHistory.create(
        fake(EncounterHistory, {
            examinerId: examiner.id,
            encounterId: encounter.id,
            departmentId: department.id,
            locationId: location.id,
        }),
    );
    await Note.create(
        fake(Note, {
            recordType: NOTE_RECORD_TYPES.ENCOUNTER,
            recordId: encounter.id,
            authorId: examiner.id
        })
    );
    await PatientBirthData.create(
        fake(PatientBirthData, {
            patientId: patient.id,
            facilityId: facility.id
        })
    );
    await SurveyScreenComponent.create(
        fake(SurveyScreenComponent, {
            option: '{"foo":"bar"}',
            config: '{"source": "ReferenceData", "where": {"type": "facility"}}',
        })
    );
    const report_definitions = await ReportDefinition.create(
        fake(ReportDefinition, {
            dbSchema: REPORT_DB_SCHEMAS.REPORTING
        })
    );
    await ReportDefinitionVersion.create(
        fake(ReportDefinitionVersion, {
            status: REPORT_STATUSES.DRAFT,
            queryOptions: `{"parameters": [], "defaultDateRange": "allTime"}`,
            reportDefinitionId: report_definitions.id,
            userId: examiner.id,
        })
    );
    const lab_request = await LabRequest.create(
        fake(LabRequest, {
            departmentId: department.id,
            collectedById: examiner.id,
            encounter: encounter.id,
        })
    );
    await LabRequestLog.create(
        fake(LabRequestLog, {
            status: 'reception_pending',
            labRequestId: lab_request.id
        })
    );
    await UserPreference.create(
        fake(UserPreference, {
            userId: examiner.id
        })
    );
    await ProgramDataElement.create(
        fake(ProgramDataElement)
    );
}

export const fakeCommand = new Command('fake')
    .description('Generate fake data using the `fake` test helper, covering tables used in recent migrations')
    .action(generateFake);
