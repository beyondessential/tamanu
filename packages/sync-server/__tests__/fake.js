import { random, sample } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { REFERENCE_TYPES } from 'shared/constants';

export function fakeStringFields(prefix, fields) {
  return fields.reduce(
    (obj, field) => ({
      ...obj,
      [field]: prefix + field,
    }),
    {},
  );
}

export function fakePatient(prefix = '') {
  const id = uuidv4();
  return {
    data: {
      id,
      ...fakeStringFields(`${prefix}patient_${id}_`, [
        'firstName',
        'middleName',
        'lastName',
        'culturalName',
        'displayId',
      ]),
      sex: sample(['male', 'female', 'other']),
      dateOfBirth: new Date(random(0, Date.now())),
      villageId: null,
    },
  };
}

export async function fakeScheduledVaccine(wrapper) {
  const vaccineId = uuidv4();
  const vaccine = {
    data: {
      id: vaccineId,
      type: REFERENCE_TYPES.DRUG,
      ...fakeStringFields(`vaccine_${vaccineId}_`, ['code', 'name']),
    },
  };
  await wrapper.insert('reference', vaccine);
  return (prefix = '') => {
    const scheduledVaccineId = uuidv4();
    return {
      data: {
        id: scheduledVaccineId,
        vaccineId,
        ...fakeStringFields(`${prefix}scheduledVaccine_${scheduledVaccineId}_`, [
          'category',
          'label',
          'schedule',
        ]),
      },
    };
  };
}

export function fakeSurvey(prefix = '') {
  const id = uuidv4();
  return {
    data: {
      id,
      programId: null,
      ...fakeStringFields(`${prefix}survey_${id}_`, ['code', 'name']),
    },
  };
}

export function fakeSurveyScreenComponent(prefix = '') {
  const id = uuidv4();
  return {
    data: {
      id,
      surveyId: null,
      dataElementId: null,
      screenIndex: random(0, 100),
      componentIndex: random(0, 100),
      options: '{"foo":"bar"}',
      ...fakeStringFields(`${prefix}survey_${id}_`, ['text', 'visibilityCriteria']),
    },
  };
}
