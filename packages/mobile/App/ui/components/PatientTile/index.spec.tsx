import React from 'react';
import { render } from '@testing-library/react-native';
import { formatDate } from '/helpers/date';
import { DateFormats } from '/helpers/constants';
import { PatientTile } from './index';
import { MaleExampleProps } from './fixtures';

describe('<PatientTile />', () => {
  const { getByText } = render(<PatientTile {...MaleExampleProps} />);

  type visibleProps = 'city' | 'name' | 'gender' | 'age' | 'lastVisit';
  const visibleProps: visibleProps[] = [
    'city',
    'name',
    'gender',
    'age',
    'lastVisit',
  ];

  it('should render Patient Tile ', () => {
    visibleProps.forEach(visibleProp => {
      switch (visibleProp) {
        case 'lastVisit':
          expect(
            getByText(
              formatDate(
                MaleExampleProps[visibleProp],
                DateFormats.DAY_MONTH_YEAR_SHORT,
              ),
            ),
          ).not.toBe(null);
          break;
        default:
          expect(
            getByText(
              visibleProp === 'age'
                ? MaleExampleProps[visibleProp].toString()
                : MaleExampleProps[visibleProp],
              {
                exact: false,
              },
            ),
          ).not.toBe(null);
      }
    });
  });
});
