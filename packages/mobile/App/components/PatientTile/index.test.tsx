import React from 'react';
import { render } from '@testing-library/react-native';
import { PatientTile } from './index';
import { MaleExampleProps } from './fixtures';
import { formatDate } from '../../helpers/date';
import { DateFormats } from '../../helpers/constants';

describe('<PatientTile />', () => {
  const { debug, getByText } = render(<PatientTile {...MaleExampleProps} />);

  type visibleProps = 'city' | 'name' | 'gender' | 'age' | 'lastVisit';
  const visibleProps: visibleProps[] = [
    'city',
    'name',
    'gender',
    'age',
    'lastVisit',
  ];

  it('should render Patient Tile ', () => {
    for (const visibleProp of visibleProps) {
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
            getByText(MaleExampleProps[visibleProp], {
              exact: false,
            }),
          ).not.toBe(null);
      }
    }
  });
});
