import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SURVEY_TYPES } from '@tamanu/constants';
import {
  createDummyEncounter,
  createDummyPatient,
  randomRecordId,
} from '@tamanu/database/demoData';
import { disableHardcodedPermissionsForSuite } from '@tamanu/shared/test-helpers';
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

  it('should default quantity to 1 when not provided', async () => {
    const result = await app.post('/api/procedure').send({
      encounterId: encounter.id,
      note: 'default quantity',
      date: new Date(),
    });
    expect(result).toHaveSucceeded();

    const record = await models.Procedure.findByPk(result.body.id);
    expect(record).toHaveProperty('quantity', 1);
  });

  it('should record a procedure with a specified quantity', async () => {
    const result = await app.post('/api/procedure').send({
      encounterId: encounter.id,
      note: 'test',
      date: new Date(),
      quantity: 3,
    });
    expect(result).toHaveSucceeded();

    const record = await models.Procedure.findByPk(result.body.id);
    expect(record).toHaveProperty('quantity', 3);
  });

  it('should reject a non-integer quantity', async () => {
    const result = await app.post('/api/procedure').send({
      encounterId: encounter.id,
      note: 'test',
      date: new Date(),
      quantity: 1.5,
    });
    expect(result).toHaveRequestError();
  });

  it('should reject a quantity less than 1', async () => {
    const result = await app.post('/api/procedure').send({
      encounterId: encounter.id,
      note: 'test',
      date: new Date(),
      quantity: 0,
    });
    expect(result).toHaveRequestError();
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

  describe('Procedure Survey Responses', () => {
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

  describe('Deleting a procedure', () => {
    const createProcedureWithForm = async () => {
      const { patient, encounter, facility, survey, department, location } =
        await createDummyData();
      await survey.update({ surveyType: SURVEY_TYPES.PROGRAMS });

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

      const dataElement = await models.ProgramDataElement.create(fake(models.ProgramDataElement));
      const answer = await models.SurveyResponseAnswer.create({
        responseId: result.body.surveyResponseId,
        dataElementId: dataElement.id,
        body: 'answer',
      });

      return { patient, encounter, procedureSurveyResponse: result.body, answer };
    };

    it('should soft-delete the procedure', async () => {
      const procedure = await models.Procedure.create({
        encounterId: encounter.id,
        date: new Date(),
      });

      const result = await app.delete(`/api/procedure/${procedure.id}`);
      expect(result).toHaveSucceeded();

      expect(await models.Procedure.findByPk(procedure.id)).toBeNull();
      const deletedProcedure = await models.Procedure.findByPk(procedure.id, { paranoid: false });
      expect(deletedProcedure.deletedAt).toBeTruthy();
    });

    it('should delete a completed procedure', async () => {
      const procedure = await models.Procedure.create({
        encounterId: encounter.id,
        date: new Date(),
        completed: true,
      });

      const result = await app.delete(`/api/procedure/${procedure.id}`);
      expect(result).toHaveSucceeded();
      expect(await models.Procedure.findByPk(procedure.id)).toBeNull();
    });

    it('should delete the forms attached to the procedure', async () => {
      const { patient, encounter, procedureSurveyResponse, answer } =
        await createProcedureWithForm();
      const { procedureId, surveyResponseId } = procedureSurveyResponse;

      const result = await app.delete(`/api/procedure/${procedureId}`);
      expect(result).toHaveSucceeded();

      expect(await models.SurveyResponse.findByPk(surveyResponseId)).toBeNull();
      expect(await models.SurveyResponseAnswer.findByPk(answer.id)).toBeNull();
      expect(await models.ProcedureSurveyResponse.findByPk(procedureSurveyResponse.id)).toBeNull();

      const patientForms = await app.get(`/api/patient/${patient.id}/programResponses`);
      expect(patientForms).toHaveSucceeded();
      expect(patientForms.body.data.map(form => form.id)).not.toContain(surveyResponseId);

      const encounterForms = await app.get(`/api/encounter/${encounter.id}/programResponses`);
      expect(encounterForms).toHaveSucceeded();
      expect(encounterForms.body.data.map(form => form.id)).not.toContain(surveyResponseId);
    });

    it('should not delete forms attached to other procedures', async () => {
      const { procedureSurveyResponse: deletedProcedureForm } = await createProcedureWithForm();
      const { procedureSurveyResponse: keptProcedureForm } = await createProcedureWithForm();

      const result = await app.delete(`/api/procedure/${deletedProcedureForm.procedureId}`);
      expect(result).toHaveSucceeded();

      expect(await models.Procedure.findByPk(keptProcedureForm.procedureId)).toBeTruthy();
      expect(await models.SurveyResponse.findByPk(keptProcedureForm.surveyResponseId)).toBeTruthy();
      expect(await models.ProcedureSurveyResponse.findByPk(keptProcedureForm.id)).toBeTruthy();
    });

    it('should delete the assistant clinician links of the procedure', async () => {
      const assistant = await createDummyUser(models, 'delete-assistant@example.com');
      const { body: procedure } = await app.post('/api/procedure').send({
        encounterId: encounter.id,
        date: new Date(),
        assistantClinicianIds: [assistant.id],
      });

      const result = await app.delete(`/api/procedure/${procedure.id}`);
      expect(result).toHaveSucceeded();

      const assistantClinicians = await models.ProcedureAssistantClinician.findAll({
        where: { procedureId: procedure.id },
      });
      expect(assistantClinicians).toHaveLength(0);
    });

    it('should return not found for a procedure that does not exist', async () => {
      const result = await app.delete(`/api/procedure/${generateId()}`);
      expect(result).toHaveStatus(404);
    });

    describe('without permission to delete procedures', () => {
      disableHardcodedPermissionsForSuite();

      it('should be forbidden', async () => {
        const procedure = await models.Procedure.create({
          encounterId: encounter.id,
          date: new Date(),
        });
        const appWithoutDelete = await baseApp.asNewRole([
          ['read', 'Procedure'],
          ['create', 'Procedure'],
          ['write', 'Procedure'],
          ['delete', 'SurveyResponse'],
        ]);

        const result = await appWithoutDelete.delete(`/api/procedure/${procedure.id}`);
        expect(result).toBeForbidden();
        expect(await models.Procedure.findByPk(procedure.id)).toBeTruthy();
      });
    });
  });
});
