import { mocked } from 'jest-mock';
import { Database } from '~/infra/db';
import { readConfig } from '~/services/config';
import {
  PROGRAM_REGISTRY_CONDITION_CATEGORIES,
  RegistrationStatus,
} from '~/constants/programRegistries';
import { fake, fakeEncounter, fakePatient, fakeUser } from '/root/tests/helpers/fake';
import { SurveyTypes } from '~/types';
import { FieldTypes } from './fields';
import {
  addProgramRegistryConditions,
  getProgramRegistryConditionOptions,
} from './programRegistryConditions';

jest.mock('~/services/config');
jest.setTimeout(60000);

const SUBMITTED_TIME = '2026-10-13 09:30:00';

const conditionQuestion = (code: string) =>
  ({ dataElement: { code, type: FieldTypes.PROGRAM_REGISTRY_CONDITION } }) as any;

const answer = (conditionId: string, categoryId: string) =>
  JSON.stringify({ conditionId, categoryId });

const create = (model, data = {}) => model.createAndSaveOne({ ...fake(model), ...data });

const createRegistry = async () => {
  const { models } = Database;
  const program = await create(models.Program);
  const survey = await create(models.Survey, {
    program: program.id,
  });
  const registry = await create(models.ProgramRegistry, {
    program: program.id,
    visibilityStatus: 'current',
  });
  const [asthma, diabetes] = await Promise.all(
    ['Asthma', 'Diabetes'].map(name =>
      create(models.ProgramRegistryCondition, {
        name,
        programRegistry: registry.id,
        visibilityStatus: 'current',
      }),
    ),
  );
  const [confirmed, recordedInError] = await Promise.all(
    ['confirmed', PROGRAM_REGISTRY_CONDITION_CATEGORIES.RECORDED_IN_ERROR].map(code =>
      create(models.ProgramRegistryConditionCategory, {
        code,
        programRegistry: registry.id,
        visibilityStatus: 'current',
      }),
    ),
  );
  return {
    survey,
    registry,
    conditions: { asthma, diabetes },
    categories: { confirmed, recordedInError },
  };
};

describe('program registry conditions from forms', () => {
  let user;

  beforeAll(async () => {
    await Database.connect();
    user = await Database.models.User.createAndSaveOne(fakeUser());
    const facility = await create(Database.models.Facility);
    mocked(readConfig).mockResolvedValue(facility.id);
  });

  const setUp = async (
    registrationStatus: RegistrationStatus | null = RegistrationStatus.Active,
  ) => {
    const { models } = Database;
    const registryData = await createRegistry();
    const patient = await models.Patient.createAndSaveOne(fakePatient());
    const registration = registrationStatus
      ? await create(models.PatientProgramRegistration, {
          registrationStatus,
          programRegistry: registryData.registry.id,
          patient: patient.id,
          clinician: user.id,
        })
      : null;
    return { ...registryData, patient, registration };
  };

  const recordedFor = registrationId =>
    Database.models.PatientProgramRegistrationCondition.find({
      where: { patientProgramRegistration: { id: registrationId } },
    });

  const submit = ({ survey, patient }, values: Record<string, string>) =>
    addProgramRegistryConditions(
      Object.keys(values).map(conditionQuestion),
      values,
      patient.id,
      survey.id,
      user.id,
      SUBMITTED_TIME,
    );

  it('records each answered condition with the submission time and user', async () => {
    const setup = await setUp();
    const { conditions, categories, registration } = setup;

    await submit(setup, { q1: answer(conditions.asthma.id, categories.confirmed.id) });

    const recorded = await recordedFor(registration.id);
    expect(recorded).toHaveLength(1);
    expect(recorded[0]).toMatchObject({
      programRegistryConditionId: conditions.asthma.id,
      programRegistryConditionCategoryId: categories.confirmed.id,
      date: SUBMITTED_TIME,
      clinicianId: user.id,
    });
  });

  it('skips conditions already recorded, but re-adds deleted and recorded-in-error ones', async () => {
    const setup = await setUp();
    const { conditions, categories, registration } = setup;
    await Database.models.PatientProgramRegistrationCondition.createAndSaveOne({
      patientProgramRegistration: registration.id,
      programRegistryCondition: conditions.asthma.id,
      programRegistryConditionCategory: categories.confirmed.id,
      date: '2026-01-01 00:00:00',
    });
    await Database.models.PatientProgramRegistrationCondition.createAndSaveOne({
      patientProgramRegistration: registration.id,
      programRegistryCondition: conditions.diabetes.id,
      programRegistryConditionCategory: categories.recordedInError.id,
      date: '2026-01-01 00:00:00',
    });

    await submit(setup, {
      q1: answer(conditions.asthma.id, categories.confirmed.id),
      q2: answer(conditions.diabetes.id, categories.confirmed.id),
    });

    const recorded = await recordedFor(registration.id);
    expect(recorded.map(c => c.programRegistryConditionId).sort()).toEqual(
      [conditions.asthma.id, conditions.diabetes.id, conditions.diabetes.id].sort(),
    );
  });

  it.each([
    ['no registration', null],
    ['an inactive registration', RegistrationStatus.Inactive],
  ])('records nothing for %s', async (_, registrationStatus) => {
    const setup = await setUp(registrationStatus);
    const { conditions, categories } = setup;

    await submit(setup, { q1: answer(conditions.asthma.id, categories.confirmed.id) });

    const count = await Database.models.PatientProgramRegistrationCondition.count({
      where: { programRegistryCondition: { id: conditions.asthma.id } },
    });
    expect(count).toBe(0);
  });

  it("rejects a condition from another program's registry", async () => {
    const setup = await setUp();
    const other = await createRegistry();

    await expect(
      submit(setup, { q1: answer(other.conditions.asthma.id, setup.categories.confirmed.id) }),
    ).rejects.toThrow("does not belong to this form's program registry");
    expect(await recordedFor(setup.registration.id)).toHaveLength(0);
  });

  it('offers current conditions and categories, and the conditions already recorded', async () => {
    const setup = await setUp();
    const { survey, patient, registry, conditions, categories, registration } = setup;
    await Database.models.PatientProgramRegistrationCondition.createAndSaveOne({
      patientProgramRegistration: registration.id,
      programRegistryCondition: conditions.asthma.id,
      programRegistryConditionCategory: categories.confirmed.id,
      date: '2026-01-01 00:00:00',
    });
    await Database.models.PatientProgramRegistrationCondition.createAndSaveOne({
      patientProgramRegistration: registration.id,
      programRegistryCondition: conditions.diabetes.id,
      programRegistryConditionCategory: categories.confirmed.id,
      date: '2026-01-01 00:00:00',
      deletionDate: '2026-02-01 00:00:00',
    });

    const options = await getProgramRegistryConditionOptions(survey.id, patient.id);

    expect(options).toMatchObject({
      programRegistry: { id: registry.id },
      isPatientRegistered: true,
      recordedConditionIds: [conditions.asthma.id],
    });
    expect(options.conditions.map(c => c.id).sort()).toEqual(
      [conditions.asthma.id, conditions.diabetes.id].sort(),
    );
    expect(options.conditionCategories).toEqual([
      { id: categories.confirmed.id, name: categories.confirmed.name },
    ]);
  });
  it('registers the patient and records the condition in one submission', async () => {
    const { models } = Database;
    const setup = await setUp(null);
    const { survey, registry, patient, conditions, categories } = setup;
    const clinicalStatus = await create(models.ProgramRegistryClinicalStatus, {
      programRegistry: registry.id,
    });
    const statusConfig = { writeToPatient: { fieldName: 'registrationClinicalStatus' } };
    const makeQuestion = async (code: string, type: string, config: object) => {
      const dataElement = await create(models.ProgramDataElement, { code, type });
      const component = await create(models.SurveyScreenComponent, {
        dataElement: dataElement.id,
        survey: survey.id,
        config: JSON.stringify(config),
        calculation: null,
        visibilityCriteria: null,
      });
      return { ...component, dataElement, getConfigObject: () => config };
    };
    const components = [
      await makeQuestion('status', FieldTypes.PATIENT_DATA, statusConfig),
      await makeQuestion('condition', FieldTypes.PROGRAM_REGISTRY_CONDITION, {}),
    ];
    const encounter = fakeEncounter();
    encounter.patient = patient;
    encounter.examiner = user;
    await models.Encounter.insert(encounter);

    const response = await models.SurveyResponse.submit(
      patient.id,
      user.id,
      {
        components,
        surveyType: SurveyTypes.Programs,
        surveyId: survey.id,
        encounterReason: 'Form',
      },
      {
        status: clinicalStatus.id,
        condition: answer(conditions.asthma.id, categories.confirmed.id),
      },
    );

    expect(response).not.toBeNull();
    const { programId } = await models.ProgramRegistry.findOne({ where: { id: registry.id } });
    const registration = await models.PatientProgramRegistration.getRecentOne(
      programId,
      patient.id,
    );
    expect(registration).toMatchObject({ clinicalStatusId: clinicalStatus.id });
    expect(await recordedFor(registration.id)).toMatchObject([
      { programRegistryConditionId: conditions.asthma.id },
    ]);
  });
});
