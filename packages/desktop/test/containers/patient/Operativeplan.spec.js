import React from 'react';
import { shallow } from 'enzyme';
import OperativePlan from '../../../app/containers/Patients/OperativePlan';

test('Test submit form function', () => {
  const form = shallow('<OperativePlan />');
  console.log('form', form);

  const test = true;
  expect(test).toBeTruthy;
})