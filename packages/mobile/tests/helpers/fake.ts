import { v4 as uuidv4 } from 'uuid';
import { random, sample } from 'lodash';

import {
  DataElementType,
  EncounterType,
  SurveyTypes,
  IAdministeredVaccine,
  IEncounter,
  IPatient,
  IPatientIssue,
  IProgram,
  IProgramDataElement,
  IReferenceData,
  IScheduledVaccine,
  ISurvey,
  ISurveyResponse,
  ISurveyResponseAnswer,
  ISurveyScreenComponent,
  IUser,
} from '~/types';

import { BaseModel } from '~/models/BaseModel';

export const fakePatient = (): IPatient => {
  const uuid = uuidv4();
  return {
    title: 'Ms.',
    id: `patient-id-${uuid}`,
    displayId: `patient_displayId-${uuid}`,
    firstName: `patient_firstName-${uuid}`,
    middleName: `patient_middleName-${uuid}`,
    lastName: `patient_lastName-${uuid}`,
    culturalName: `patient_culturalName-${uuid}`,
    village: null,
    villageId: null,
    dateOfBirth: new Date(),
    sex: `female-${uuid}`,
    markedForSync: false,
  };
};

export const fakeEncounter = (): IEncounter => ({
  id: `encounter-id-${uuidv4()}`,
  encounterType: EncounterType.Clinic,
  startDate: new Date(),
  reasonForEncounter: 'encounter-reason',
  deviceId: null,
});

export const fakeAdministeredVaccine = (): IAdministeredVaccine => ({
  id: `administered-vaccine-id-${uuidv4()}`,
  status: 'done',
  date: new Date(),
});

export const fakeProgramDataElement = (): IProgramDataElement => ({
  id: `program-data-element-id-${uuidv4()}`,
  code: 'program-data-element-code',
  defaultText: 'program-data-element-defaultText',
  type: DataElementType.FreeText,
  defaultOptions: null,
  name: 'program-data-element-name',
});

export const fakeSurvey = (): ISurvey => ({
  id: `survey-id-${uuidv4()}`,
  programId: null,
  name: 'survey-name',
  surveyType: SurveyTypes.Programs,
});

export const fakeSurveyScreenComponent = (): ISurveyScreenComponent => ({
  id: `survey-screen-component-${uuidv4()}`,
  dataElementId: null,
  surveyId: null,
  screenIndex: 1,
  componentIndex: 2,
  text: 'survey-screen-component-text',
  visibilityCriteria: 'survey-screen-component-visibilityCriteria',
  validationCriteria: 'survey-screen-component-validationCriteria',
  options: 'survey-screen-component-options',
  detail: 'survey-screen-component-detail',
  config: 'survey-screen-component-config',
  calculation: '',
});

export const fakeSurveyResponse = (): ISurveyResponse => ({
  id: `survey-response-id-${uuidv4()}`,
  startTime: new Date(),
  endTime: new Date(),
});

export const fakeSurveyResponseAnswer = (): ISurveyResponseAnswer => ({
  id: `survey-response-answer-id-${uuidv4()}`,
  body: 'survey-response-answer-body',
  name: 'survey-response-answer-name',
});

export const fakeReferenceData = (): IReferenceData => {
  const uuid = uuidv4();
  return {
    id: `reference-data-id-${uuid}`,
    name: `reference-data-name-${uuid}`,
    code: `reference-data-code-${uuid}`,
    type: `reference-data-type-${uuid}`,
  };
};

export const fakeUser = (): IUser => {
  const uuid = uuidv4();
  return {
    id: `user-id-${uuid}`,
    email: `user-email-${uuid}@example.com`,
    displayName: `user-displayName-${uuid}`,
    role: 'practitioner',
    localPassword: null,
  };
};

export const fakeScheduledVaccine = (): IScheduledVaccine => {
  const uuid = uuidv4();
  return {
    id: `scheduled-vaccine-id-${uuid}`,
    vaccine: null,
    vaccineId: null,
    index: 10,
    label: `scheduled-vaccine-label-${uuid}`,
    schedule: `scheduled-vaccine-schedule-${uuid}`,
    weeksFromBirthDue: 5,
    category: `scheduled-vaccine-category-${uuid}`,
  };
};

export const fakeProgram = (): IProgram => {
  const uuid = uuidv4();
  return {
    id: `program-id-${uuid}`,
    name: `program-name-${uuid}`,
  };
};

type FakeOptions = {
  relations?: string[];
};

const fakeDate = () => new Date(random(0, Date.now()));
const fakeString = ({ propertyName, entityMetadata }, id: string) => `${entityMetadata.name}.${propertyName}.${id}`;
const fakeNumber = () => random(0, 10);
const FIELD_HANDLERS = {
  String: fakeString,
  varchar: fakeString,
  text: fakeString,
  Boolean: () => sample([true, false]),
  Date: fakeDate,
  datetime: fakeDate,
  bigint: fakeNumber,
  int: fakeNumber,
  Number: fakeNumber,
};

// uses model metadata to generate a fake
export const fake = (model: typeof BaseModel, { relations = [] }: FakeOptions = {}) => {
  const { metadata } = model.getRepository();

  const record: any = {};
  const id = uuidv4();
  // assign columns
  for (const column of metadata.ownColumns) {
    const typeId = (typeof column.type === 'function') ? column.type.name : column.type;
    if (model.excludedSyncColumns.includes(column.propertyName)) {
      // ignore excluded columns
    } else if (column.relationMetadata) {
      // ignore relations
    } else if (column.propertyName === 'id') {
      record.id = id;
    } else if (FIELD_HANDLERS[typeId]) {
      record[column.propertyName] = FIELD_HANDLERS[typeId](column, id);
    } else {
      throw new Error(`Could not fake field ${model.name}.${column.propertyName} of type ${typeId}`);
    }
  }

  // assign chosen relations
  const rootRelationNames = relations.filter(rn => !rn.includes('.')); // e.g. ['surveyResponse', 'administeredVaccines']
  const multiLevelRelationNames = relations.filter(rn => rn.includes('.')); // e.g. ['surveyResponse.answers']

  for (const relationName of rootRelationNames) { // traverse relations specific to the model itself
    // find metadata for the relation
    const relation = metadata.relations.find(r => r.propertyPath === relationName);

    const childRelationNames = multiLevelRelationNames
      .filter(rn => rn.startsWith(relationName)) // e.g. if relationName is 'surveyResponse', find ['surveyResponse.answers']
      .map(rn => rn.slice(relationName.length + 1)); // cut off the relationName and full stop, e.g. ['answers']

    if (relation?.relationType === 'one-to-many') {
      // at the moment, we only handle one-to-many relations - if you need something different, implement it!
      const childRecord = fake(relation.type as typeof BaseModel, { relations: childRelationNames });
      record[relationName] = [{
        ...childRecord,
        [`${relation.inverseSidePropertyPath}Id`]: record.id,
      }];
    } else {
      throw new Error(`Could not fake relation ${model.name}.${relationName}`);
    }
  }

  return record;
};

// recursively converts a db record to a sync record
export const toSyncRecord = (record: any) => ({
  data: Object.entries(record).reduce((memo, [k, v]) => {
    if (Array.isArray(v)) {
      return { ...memo, [k]: v.map(childRecord => toSyncRecord(childRecord)) };
    } else if (typeof v === 'object' && v !== null && (v as any).id) {
      return { ...memo, [k]: v, [`${k}Id`]: (v as any).id };
    }
    return { ...memo, [k]: v };
  }, {}),
});

// takes a record generated by fake() and creates all the relations
export const createRelations = async (model: typeof BaseModel, record: any) => {
  for (const relation of model.getRepository().metadata.relations) {
    if (Array.isArray(record[relation.propertyPath])) {
      const childModel = (relation.type as typeof BaseModel);
      for (const childRecord of record[relation.propertyPath]) {
        await childModel.createAndSaveOne({
          ...childRecord,
          [relation.inverseSidePropertyPath]: { id: record.id },
        });
        await createRelations(childModel, childRecord);
      }
    }
  }
};
