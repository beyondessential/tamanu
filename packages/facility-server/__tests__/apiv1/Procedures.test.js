import {
  createDummyEncounter,
  createDummyPatient,
  randomRecordId,
} from '@tamanu/database/demoData';
import { generateId } from '@tamanu/utils/generateId';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';

async function createDummyProcedure(models) {
  const locationId = await randomRecordId(models, 'Location');
  return {
    note: '',
    date: new Date(),
    locationId,
  };
}

async function createDummyUser(models, email = 'test@example.com') {
  return models.User.create({
    id: generateId(),
    email,
    displayName: 'Test User',
  });
}

describe('Procedures', () => {
  let patient = null;
  let app = null;
  let encounter = null;
  let baseApp = null;
  let models = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    patient = await models.Patient.create(await createDummyPatient(models));
    app = await baseApp.asRole('practitioner');
    encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
      reasonForEncounter: 'vitals test',
    });
  });
  afterAll(() => ctx.close());

  it('should record a procedure', async () => {
    const result = await app.post('/api/procedure').send({
      encounterId: encounter.id,
      note: 'test',
      date: new Date(),
    });
    expect(result).toHaveSucceeded();

    const record = await models.Procedure.findByPk(result.body.id);
    expect(record).toHaveProperty('note', 'test');
  });

  it('should update a procedure', async () => {
    const record = await models.Procedure.create({
      ...(await createDummyProcedure(models)),
      note: 'before',
      encounterId: encounter.id,
    });

    const result = await app.put(`/api/procedure/${record.id}`).send({
      note: 'after',
    });
    expect(result).toHaveSucceeded();

    const updated = await models.Procedure.findByPk(record.id);
    expect(updated).toHaveProperty('note', 'after');
  });

  it('should close a procedure', async () => {
    const record = await models.Procedure.create({
      ...(await createDummyProcedure(models)),
      encounterId: encounter.id,
    });
    expect(record.endTime).toBeFalsy();

    const result = await app.put(`/api/procedure/${record.id}`).send({
      endTime: new Date(),
    });
    expect(result).toHaveSucceeded();

    const updated = await models.Procedure.findByPk(record.id);
    expect(updated.endTime).toBeTruthy();
  });

  describe('Assistant Clinicians', () => {
    it('should create a procedure with assistant clinicians', async () => {
      const user1 = await createDummyUser(models, 'assistant1@example.com');
      const user2 = await createDummyUser(models, 'assistant2@example.com');

      const result = await app.post('/api/procedure').send({
        encounterId: encounter.id,
        note: 'test with assistants',
        date: new Date(),
        assistantClinicianIds: [user1.id, user2.id],
      });
      expect(result).toHaveSucceeded();

      // Check that assistant clinicians were created
      const assistants = await models.ProcedureAssistantClinician.findAll({
        where: { procedureId: result.body.id },
      });
      expect(assistants).toHaveLength(2);
      expect(assistants.map(a => a.userId)).toContain(user1.id);
      expect(assistants.map(a => a.userId)).toContain(user2.id);
    });

    it('should return assistant clinician IDs when retrieving a procedure', async () => {
      const user1 = await createDummyUser(models, 'assistant3@example.com');
      const user2 = await createDummyUser(models, 'assistant4@example.com');

      const procedure = await models.Procedure.create({
        ...(await createDummyProcedure(models)),
        encounterId: encounter.id,
      });

      // Create assistant clinician associations
      await models.ProcedureAssistantClinician.bulkCreate([
        { procedureId: procedure.id, userId: user1.id },
        { procedureId: procedure.id, userId: user2.id },
      ]);

      const result = await app.get(`/api/procedure/${procedure.id}`);
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveProperty('assistantClinicianIds');
      expect(result.body.assistantClinicianIds).toHaveLength(2);
      expect(result.body.assistantClinicianIds).toContain(user1.id);
      expect(result.body.assistantClinicianIds).toContain(user2.id);
    });

    it('should update assistant clinicians when updating a procedure', async () => {
      const user1 = await createDummyUser(models, 'assistant5@example.com');
      const user2 = await createDummyUser(models, 'assistant6@example.com');
      const user3 = await createDummyUser(models, 'assistant7@example.com');

      const procedure = await models.Procedure.create({
        ...(await createDummyProcedure(models)),
        encounterId: encounter.id,
      });

      // Initially add two assistant clinicians
      await models.ProcedureAssistantClinician.bulkCreate([
        { procedureId: procedure.id, userId: user1.id },
        { procedureId: procedure.id, userId: user2.id },
      ]);

      // Update to replace with different assistant clinicians
      const result = await app.put(`/api/procedure/${procedure.id}`).send({
        assistantClinicianIds: [user2.id, user3.id], // Keep user2, remove user1, add user3
      });
      expect(result).toHaveSucceeded();

      const assistants = await models.ProcedureAssistantClinician.findAll({
        where: { procedureId: procedure.id },
      });
      expect(assistants).toHaveLength(2);
      expect(assistants.map(a => a.userId)).toContain(user2.id);
      expect(assistants.map(a => a.userId)).toContain(user3.id);
      expect(assistants.map(a => a.userId)).not.toContain(user1.id);
    });

    it('should remove all assistant clinicians when updating with empty array', async () => {
      const user1 = await createDummyUser(models, 'assistant8@example.com');
      const user2 = await createDummyUser(models, 'assistant9@example.com');

      const procedure = await models.Procedure.create({
        ...(await createDummyProcedure(models)),
        encounterId: encounter.id,
      });

      // Initially add assistant clinicians
      await models.ProcedureAssistantClinician.bulkCreate([
        { procedureId: procedure.id, userId: user1.id },
        { procedureId: procedure.id, userId: user2.id },
      ]);

      // Update with empty array to remove all
      const result = await app.put(`/api/procedure/${procedure.id}`).send({
        assistantClinicianIds: [],
      });
      expect(result).toHaveSucceeded();

      const assistants = await models.ProcedureAssistantClinician.findAll({
        where: { procedureId: procedure.id },
      });
      expect(assistants).toHaveLength(0);
    });

    it('should not affect assistant clinicians when assistantClinicianIds is not provided in update', async () => {
      const user1 = await createDummyUser(models, 'assistant10@example.com');

      const procedure = await models.Procedure.create({
        ...(await createDummyProcedure(models)),
        encounterId: encounter.id,
        note: 'original note',
      });

      // Add an assistant clinician
      await models.ProcedureAssistantClinician.create({
        procedureId: procedure.id,
        userId: user1.id,
      });

      // Update without providing assistantClinicianIds
      const result = await app.put(`/api/procedure/${procedure.id}`).send({
        note: 'updated note',
      });
      expect(result).toHaveSucceeded();

      // Assistant clinician should still exist
      const assistants = await models.ProcedureAssistantClinician.findAll({
        where: { procedureId: procedure.id },
      });
      expect(assistants).toHaveLength(1);
      expect(assistants[0].userId).toBe(user1.id);

      // But the note should be updated
      const updated = await models.Procedure.findByPk(procedure.id);
      expect(updated.note).toBe('updated note');
    });
  });

  describe('Procedure Survey Responses', () => {
    const createDummyData = async () => {
      const facility = await models.Facility.create(fake(models.Facility));
      const location = await models.Location.create({
        ...fake(models.Location),
        facilityId: facility.id,
      });
      const department = await models.Department.create({
        ...fake(models.Department),
        facilityId: facility.id,
      });
      const examiner = await models.User.create(fake(models.User));
      const patient = await models.Patient.create(fake(models.Patient));
      const encounter = await models.Encounter.create({
        ...fake(models.Encounter),
        patientId: patient.id,
        departmentId: department.id,
        locationId: location.id,
        examinerId: examiner.id,
      });
      const program = await models.Program.create(fake(models.Program));
      const survey = await models.Survey.create({
        ...fake(models.Survey),
        programId: program.id,
      });

      return { patient, encounter, facility, survey, department, location, examiner, program };
    };

    it('should create ProcedureSurveyResponse when procedureId is provided', async () => {
      const { patient, encounter, facility, survey, department, location } =
        await createDummyData();
      const existingProcedure = await models.Procedure.create({
        id: 'existing-procedure-id',
        completed: false,
        date: new Date(),
        encounterId: encounter.id,
      });

      const result = await app.post('/api/procedure/surveyResponse').send({
        patientId: patient.id,
        encounterId: encounter.id,
        surveyId: survey.id,
        facilityId: facility.id,
        locationId: location.id,
        departmentId: department.id,
        procedureId: existingProcedure.id,
        answers: {},
      });

      expect(result).toHaveSucceeded();

      const procedureSurveyResponse = await models.ProcedureSurveyResponse.findByPk(result.body.id);
      expect(procedureSurveyResponse).toBeTruthy();
      expect(procedureSurveyResponse.procedureId).toBe(existingProcedure.id);

      const surveyResponse = await models.SurveyResponse.findByPk(
        procedureSurveyResponse.surveyResponseId,
      );
      expect(surveyResponse).toBeTruthy();
    });

    it('should create new Procedure when procedureId does not exist', async () => {
      const { patient, encounter, facility, survey, department, location } =
        await createDummyData();

      const result = await app.post('/api/procedure/surveyResponse').send({
        patientId: patient.id,
        encounterId: encounter.id,
        surveyId: survey.id,
        facilityId: facility.id,
        locationId: location.id,
        departmentId: department.id,
        answers: {},
      });

      expect(result).toHaveSucceeded();

      const procedureSurveyResponse = await models.ProcedureSurveyResponse.findByPk(result.body.id);
      expect(procedureSurveyResponse).toBeTruthy();

      const procedure = await models.Procedure.findByPk(procedureSurveyResponse.procedureId);
      expect(procedure).toBeTruthy();
      expect(procedure.completed).toBe(false);

      const surveyResponse = await models.SurveyResponse.findByPk(
        procedureSurveyResponse.surveyResponseId,
      );
      expect(surveyResponse).toBeTruthy();
    });
  });
});
