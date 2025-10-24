import { v4 as uuidv4 } from 'uuid';
import { random, sample } from 'lodash';
import { formatISO9075 } from 'date-fns';

import {
  DataElementType,
  EncounterType,
  IAdministeredVaccine,
  IEncounter,
  IPatient,
  IProgram,
  IProgramDataElement,
  IReferenceData,
  IScheduledVaccine,
  ISurvey,
  ISurveyResponse,
  ISurveyResponseAnswer,
  ISurveyScreenComponent,
  IUser,
  ReferenceDataType,
  SurveyTypes,
} from '~/types';

import { BaseModel } from '~/models/BaseModel';
import { ID } from '~/types/ID';
import { VaccineStatus } from '~/ui/helpers/patient';
import { getCurrentDateTimeString } from '../../App/ui/helpers/date';
import { VisibilityStatus } from '~/visibilityStatuses';

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
    villageId: null,
    dateOfBirth: formatISO9075(new Date()),
    sex: `female-${uuid}`,
    email: `${uuid}@email.com`,
  };
};

export const fakeEncounter = (): IEncounter => ({
  id: `encounter-id-${uuidv4()}`,
  encounterType: EncounterType.Clinic,
  startDate: formatISO9075(new Date()),
  reasonForEncounter: 'encounter-reason',
  deviceId: null,
});

export const fakeAdministeredVaccine = (): IAdministeredVaccine => ({
  id: `administered-vaccine-id-${uuidv4()}`,
  status: VaccineStatus.GIVEN,
  date: formatISO9075(new Date()),
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
  isSensitive: false,
  visibilityStatus: VisibilityStatus.Current,
});

// @ts-expect-error
// The tests in import.spec.ts tests break if getConfigObject or getOptions are present, but these are
// required by ISurveyScreenComponent. The checks in import.spec.ts will need to be updated to ignore
// these keys before this function can be typed correctly.
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

export const fakeSurveyResponse = (survey: ISurvey): ISurveyResponse => ({
  id: `survey-response-id-${uuidv4()}`,
  startTime: getCurrentDateTimeString(),
  endTime: getCurrentDateTimeString(),
  surveyId: survey.id,
});

export const fakeSurveyResponseAnswer = (
  responseId: ID,
  programDataElement: IProgramDataElement,
): ISurveyResponseAnswer => ({
  id: `survey-response-answer-id-${uuidv4()}`,
  body: 'survey-response-answer-body',
  name: 'survey-response-answer-name',
  responseId,
  dataElement: programDataElement,
  dataElementId: programDataElement.id,
});

export const fakeReferenceData = (type?: ReferenceDataType): IReferenceData => {
  const uuid = uuidv4();
  return {
    id: `reference-data-id-${uuid}`,
    name: `reference-data-name-${uuid}`,
    code: `reference-data-code-${uuid}`,
    type: type || ReferenceDataType.Village,
    visibilityStatus: VisibilityStatus.Current,
  };
};

export const fakeUser = (): IUser => {
  const uuid = uuidv4();
  return {
    id: `user-id-${uuid}`,
    displayId: `user-displayId-${uuid}`,
    email: `user-email-${uuid}@example.com`,
    displayName: `user-displayName-${uuid}`,
    role: 'practitioner',
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
    doseLabel: `scheduled-vaccine-schedule-${uuid}`,
    weeksFromBirthDue: 5,
    weeksFromLastVaccinationDue: null,
    category: `scheduled-vaccine-category-${uuid}`,
    visibilityStatus: VisibilityStatus.Current,
    sortIndex: 0,
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
const fakeString = ({ propertyName, entityMetadata }, id: string) =>
  `${entityMetadata.name}.${propertyName}.${id}`;
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
    const typeId = typeof column.type === 'function' ? column.type.name : column.type;
    if (model.excludedSyncColumns.includes(column.propertyName)) {
      // ignore excluded columns
    } else if (column.relationMetadata) {
      // ignore relations
    } else if (column.propertyName === 'id') {
      record.id = id;
    } else if (FIELD_HANDLERS[typeId]) {
      record[column.propertyName] = FIELD_HANDLERS[typeId](column, id);
    } else {
      throw new Error(
        `Could not fake field ${model.name}.${column.propertyName} of type ${typeId}`,
      );
    }
  }

  // assign chosen relations
  const rootRelationNames = relations.filter(rn => !rn.includes('.')); // e.g. ['surveyResponse', 'administeredVaccines']
  const multiLevelRelationNames = relations.filter(rn => rn.includes('.')); // e.g. ['surveyResponse.answers']

  for (const relationName of rootRelationNames) {
    // traverse relations specific to the model itself
    // find metadata for the relation
    const relation = metadata.relations.find(r => r.propertyPath === relationName);

    const childRelationNames = multiLevelRelationNames
      .filter(rn => rn.startsWith(relationName)) // e.g. if relationName is 'surveyResponse', find ['surveyResponse.answers']
      .map(rn => rn.slice(relationName.length + 1)); // cut off the relationName and full stop, e.g. ['answers']

    if (!relation) {
      throw new Error(`Relation ${model.name}.${relationName} doesn't exist`);
    }
    if (relation.relationType === 'one-to-many') {
      const childRecord = fake(relation.type as typeof BaseModel, {
        relations: childRelationNames,
      });
      record[relationName] = [
        {
          ...childRecord,
          [`${relation.inverseSidePropertyPath}Id`]: record.id,
        },
      ];
    } else if (relation.relationType === 'many-to-one') {
      const childRecord = fake(relation.type as typeof BaseModel, {
        relations: childRelationNames,
      });
      record[relationName] = childRecord;
    } else {
      // at the moment, we only handle some types of relations - if you need something different, implement it!
      throw new Error(
        `Could not fake relation ${model.name}.${relationName} (unsupported type ${relation?.relationType})`,
      );
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
export const createWithRelations = async (model: typeof BaseModel, record: any) => {
  const relations = model.getRepository().metadata.relations;

  // create many-to-one relations
  for (const relation of relations.filter(r => r.relationType === 'many-to-one')) {
    const childRecord = record[relation.propertyPath];
    if (childRecord) {
      await createWithRelations(relation.type as typeof BaseModel, childRecord);
    }
  }

  await model.createAndSaveOne(record);

  // create one-to-many relations
  for (const relation of relations.filter(r => r.relationType === 'one-to-many')) {
    if (Array.isArray(record[relation.propertyPath])) {
      const childModel = relation.type as typeof BaseModel;
      for (const childRecord of record[relation.propertyPath]) {
        await createWithRelations(childModel, {
          ...childRecord,
          [relation.inverseSidePropertyPath]: { id: record.id },
        });
      }
    }
  }
};
