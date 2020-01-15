import { getTestContext } from '../utilities';

const app = getTestContext();

describe('Visit', () => {
  test.todo('should reject a user with insufficient permissions');
  test.todo('should create an access record');

  test.todo('should get a list of diagnoses');
  test.todo('should get a list of vitals readings');
  test.todo('should get a list of notes');
  test.todo('should get a list of procedures');
  test.todo('should get a list of lab requests');
  test.todo('should get a list of imaging requests');
  test.todo('should get a list of prescriptions');

  describe('write', () => {
    test.todo('should reject a user with insufficient permissions');

    describe('journey', () => {
      test.todo('should admit a patient');
      test.todo('should update visit details');
      test.todo('should change visit department');
      test.todo('should change visit location');
      test.todo('should discharge a patient');

      test.todo('should not admit a patient who is already in a visit');
      test.todo('should not admit a patient who is dead');
    });

    test.todo('should record a diagnosis');
    test.todo('should update a diagnosis');
    test.todo('should record a vitals reading');
    test.todo('should update a vitals reading');
    test.todo('should record a note');
    test.todo('should update a note');
  });
});
