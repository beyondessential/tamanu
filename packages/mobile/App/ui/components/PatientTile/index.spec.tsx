// import React from 'react';
// import { render } from '@testing-library/react-native';
// import { formatDate, getAgeFromDate } from '/helpers/date';
// import { DateFormats } from '/helpers/constants';
// import { PatientTile } from './index';
// import { MaleExampleProps } from './fixtures';

// Failing test skipped
describe.skip('<PatientTile />', () => {
  // const { getByText } = render(<PatientTile {...MaleExampleProps} />);
  //
  // type visibleProps = 'city' | 'name' | 'gender' | 'dateOfBirth' | 'lastVisit';
  // const visibleProps: visibleProps[] = [
  //   'city',
  //   'name',
  //   'gender',
  //   'dateOfBirth',
  //   'lastVisit',
  // ];

  it('should render Patient Tile ', () => {
    // visibleProps
    //   .filter(prop => prop !== 'gender')
    //   .forEach(visibleProp => {
    //     switch (visibleProp) {
    //       case 'lastVisit':
    //         expect(App/ui/components/Dropdown/index.spec.tsx
    //           getByText(
    //             formatDate(
    //               MaleExampleProps[visibleProp],
    //               DateFormats.DAY_MONTH_YEAR_SHORT,
    //             ),
    //             {
    //               exact: false,
    //             },
    //           ),
    //         ).not.toBe(null);
    //         break;
    //       case 'dateOfBirth':
    //         break;
    //       default:
    //         expect(
    //           getByText(MaleExampleProps[visibleProp],
    //             {
    //               exact: false,
    //             }),
    //         ).not.toBe(null);
    //     }
    //   });
  });
});
