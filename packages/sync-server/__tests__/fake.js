import { random, sample } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

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
