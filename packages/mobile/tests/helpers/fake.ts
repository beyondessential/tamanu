import { v4 as uuidv4 } from 'uuid';
import { random, sample } from 'es-toolkit/compat';
import { formatISO9075 } from 'date-fns';

import {
  DataElementType,
  EncounterType,
  IEncounter,
  IPatient,
  IProgramDataElement,
  ISurvey,
  IUser,
  SurveyTypes,
} from '~/types';

import { BaseModel } from '~/models/BaseModel';
import { VisibilityStatus } from '~/visibilityStatuses';
import { Task } from '~/models/Task';

export const fakePatient = (): IPatient => {
  const uuid = uuidv4();
  return {
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

export const fakeUser = (): IUser => {
  const uuid = uuidv4();
  return {
    id: `user-id-${uuid}`,
    displayId: `user-displayId-${uuid}`,
    email: `user-email-${uuid}@example.com`,
    displayName: `user-displayName-${uuid}`,
    role: 'practitioner',
    kind: 'user',
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

export const fakeTask = (encounterId: string, requestedByUserId: string, overrides: Partial<Task> = {}): Partial<Task> => ({
  id: uuidv4(),
  name: 'test-task',
  dueTime: new Date().toISOString(),
  requestTime: new Date().toISOString(),
  status: 'todo',
  taskType: 'normal_task',
  encounterId,
  requestedByUserId,
  ...overrides,
});
