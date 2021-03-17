// import React from 'react';
// import { render, fireEvent } from '@testing-library/react-native';
// import { DateFormats } from '/helpers/constants';
// import { formatDate, getAgeFromDate } from '/helpers/date';
// import { PatientCard, PatientCardProps } from './index';

describe.skip('<PatientCard />', () => {
  // const props: PatientCardProps = {
  //   onPress: jest.fn(),
  //   patient: {
  //     id: '',
  //     displayId: '',
  //     culturalName: 'cba',
  //     firstName: 'firstName',
  //     middleName: 'middleName',
  //     lastName: 'lastName',
  //     sex: 'Female',
  //     dateOfBirth: new Date(2000, 1, 1),
  //   },
  // };
  // const desiredDisplay = {
  //   village: 'village goes here',
  //   name: 'firstName lastName',
  //   gender: props.patient.sex,
  //   age: getAgeFromDate(props.patient.dateOfBirth).toString(),
  // };
  //
  // const { getByText } = render(<PatientCard {...props} />);
  it('should render <PatientCard/> correctly', () => {
    // Object.values(desiredDisplay).forEach((value) => {
    //   expect(
    //     getByText(value, { exact: false }),
    //   ).not.toBe(null);
    // });
  });

  it('should handle onPress', () => {
    // fireEvent.press(getByText(desiredDisplay.name));
    // expect(props.onPress).toHaveBeenCalled();
  });
});
