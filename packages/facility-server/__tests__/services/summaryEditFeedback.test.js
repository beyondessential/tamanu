import { createDummyPatient } from '@tamanu/database/demoData/patients';

import { getPatientSummaryEditFeedback } from '../../app/services/patientSummary';
import { createTestContext } from '../utilities';

describe('getPatientSummaryEditFeedback', () => {
  let ctx;
  let models;
  let sequelize;
  let patient;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    sequelize = ctx.sequelize;
    patient = await models.Patient.create(await createDummyPatient(models));
  });
  afterAll(() => ctx.close());

  beforeEach(async () => {
    await models.AiDocument.truncate({ cascade: true, force: true });
    await sequelize.query(`DELETE FROM logs.changes WHERE table_name = 'ai_documents'`);
  });

  // Mirrors what regenerateAiPatientSummary does: the composite primary key makes
  // this reset an existing row rather than insert a second one.
  const generate = content =>
    models.AiDocument.upsert({
      type: 'patient_summary',
      recordType: 'Patient',
      recordId: patient.id,
      content,
      status: 'generated',
      source: 'ai',
    });

  const editByClinician = async content => {
    const doc = await models.AiDocument.findOne({
      where: { type: 'patient_summary', recordType: 'Patient', recordId: patient.id },
    });
    await doc.update({ content, status: 'edited', source: 'human' });
  };

  const feedback = () => getPatientSummaryEditFeedback(patient.id, models, sequelize);

  it('returns nothing when no summary has ever been generated', async () => {
    expect(await feedback()).toEqual([]);
  });

  it('returns nothing when a summary was generated but never edited', async () => {
    await generate('AI version one.');

    expect(await feedback()).toEqual([]);
  });

  it('pairs a clinician edit with the AI output it replaced', async () => {
    await generate('AI version one.');
    await editByClinician('Clinician version one.');

    expect(await feedback()).toEqual([
      { aiGenerated: 'AI version one.', userEdited: 'Clinician version one.' },
    ]);
  });

  it('ignores an edit that left the content unchanged', async () => {
    await generate('AI version one.');
    await editByClinician('AI version one.');

    expect(await feedback()).toEqual([]);
  });

  it('returns pairs oldest first, which the prompt relies on for precedence', async () => {
    await generate('AI version one.');
    await editByClinician('Clinician version one.');
    await generate('AI version two.');
    await editByClinician('Clinician version two.');

    const pairs = await feedback();

    expect(pairs.map(p => p.userEdited)).toEqual([
      'Clinician version one.',
      'Clinician version two.',
    ]);
  });

  it('pairs every edit against the original AI output, not the latest regeneration', async () => {
    await generate('AI version one.');
    await editByClinician('Clinician version one.');
    await generate('AI version two.');
    await editByClinician('Clinician version two.');

    const pairs = await feedback();

    expect(pairs.map(p => p.aiGenerated)).toEqual(['AI version one.', 'AI version one.']);
  });
});
