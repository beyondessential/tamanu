/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PatientCard, PatientCardProps } from './index';
import { DateFormats } from '../../helpers/constants';
import { formatDate } from '../../helpers/date';

describe('<PatientCard />', () => {
  const props: PatientCardProps = {
    onPress: jest.fn(),
    city: 'Nguvia',
    name: 'Leinani Tanangada',
    gender: 'Female',
    age: '12',
    lastVisit: new Date('2019-05-05'),
  };
  type visibleProps = 'city' | 'name' | 'gender' | 'age' | 'lastVisit';
  const visibleProps: visibleProps[] = [
    'city',
    'name',
    'gender',
    'age',
    'lastVisit',
  ];

  const { getByText } = render(<PatientCard {...props} />);
  it('should render <PatientCard/> correctly', () => {
    visibleProps.forEach(visibleProp => {
      switch (visibleProp) {
        case 'lastVisit':
          expect(
            getByText(formatDate(props[visibleProp], DateFormats.short)),
          ).not.toBe(null);
          break;
        default:
          expect(
            getByText(props[visibleProp], {
              exact: false,
            }),
          ).not.toBe(null);
      }
    });
  });

  it('should handle onPress', () => {
    fireEvent.press(getByText(props.name));
    expect(props.onPress).toHaveBeenCalled();
  });
});
