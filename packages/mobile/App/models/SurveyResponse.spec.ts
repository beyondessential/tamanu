import { Database } from '~/infra/db/index';
import { fake } from '/root/tests/helpers/fake';
import {
  SurveyTypes,
  IEncounter,
  ISurveyResponse,
  ISurveyResponseAnswer,
  DataElementType,
  EncounterType,
} from '~/types/index';
import { writeConfig } from '~/services/config';

beforeAll(async () => {
  await Database.connect();
});

describe('creating a new survey response', () => {
  let response: ISurveyResponse;
  let answers: ISurveyResponseAnswer[];

  beforeAll(async () => {
    // arrange survey
    const { Program, Survey, SurveyScreenComponent, ProgramDataElement } = Database.models;
    const program = await Program.createAndSaveOne(fake(Program));
    const survey = await Survey.createAndSaveOne(fake(Survey, {
      fields: { programId: program.id },
    }));
    const questions: [string, object, object][] = [
      ['TstNum', { type: DataElementType.Number }, { calculation: null }],
      [
        'TstCalc',
        { type: DataElementType.Calculated },
        { calculation: 'TstNum * TstNumOmitted' },
      ],
      [
        'TstNumOmitted',
        { type: DataElementType.Number },
        { calculation: null, config: '{"omitData":true}' },
      ],
      ['TstEmpty', { type: DataElementType.FreeText }, { calculation: null }],
    ];
    await Promise.all(
      questions.map(async ([code, pdeData, sscData]) => {
        const pde = await ProgramDataElement.createAndSaveOne(
          fake(ProgramDataElement, {
            fields: {
              id: `pde-${code}`,
              code,
              ...pdeData,
            },
          }),
        );
        await SurveyScreenComponent.createAndSaveOne(
          fake(SurveyScreenComponent, {
            fields: {
              id: `ssc-${code}`,
              surveyId: survey.id,
              dataElementId: pde.id,
              ...sscData,
            },
          }),
        );
      }),
    );

    // arrange other requirements to populate an answer
    const { Patient, User, Encounter, Facility, Department, Location } = Database.models;
    const facility = await Facility.createAndSaveOne(fake(Facility));
    await writeConfig('facilityId', facility.id);
    const department = await Department.createAndSaveOne(fake(Department, {
      fields: { facilityId: facility.id },
    }));
    const location = await Location.createAndSaveOne(
      fake(Location, {
        fields: {
          departmentId: department.id,
          facilityId: facility.id,
        },
      }),
    );
    const patient = await Patient.createAndSaveOne(fake(Patient));
    const examiner = await User.createAndSaveOne(fake(User));
    const encounter = await Encounter.getOrCreateCurrentEncounter(
      patient.id,
      examiner.id,
      {
        departmentId: department.id,
        locationId: location.id,
        encounterType: EncounterType.SurveyResponse,
        reasonForEncounter: 'running tests',
      },
    ) as unknown as IEncounter;

    // act
    const { SurveyResponse, SurveyResponseAnswer } = Database.models;
    response = await SurveyResponse.submit(
      patient.id,
      examiner.id,
      {
        surveyId: survey.id,
        encounter,
        encounterReason: '',
        surveyType: SurveyTypes.Programs,
        components: [],
      },
      {
        'pde-TstNum': 2,
        'pde-TstNumOmitted': 3,
        'pde-TstEmpty': null,
      },
    ) as unknown as ISurveyResponse;
    answers = await SurveyResponseAnswer.getRepository().find({
      where: { responseId: response.id },
    }) as unknown[] as ISurveyResponseAnswer[];
  });

  it('creates 2 answers', () => {
    expect(answers).toHaveLength(2);
  });

  it.each([
    ['pde-TstNum', '2'],
    ['pde-TstCalc', '6.0'],
    ['pde-TstNumOmitted', null],
    ['pde-TstEmpty', null],
  ])('creates an answer for %s', (dataElementId, body) => {
    // assert
    const answer = answers.find(a => a.dataElementId === dataElementId);
    if (!body) {
      expect(answer).toBeUndefined();
    } else {
      expect(answer).toHaveProperty('body', body);
    }
  });
});
