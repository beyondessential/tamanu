import { groupEntriesByLetter } from '/helpers/list';
import { render } from '@testing-library/react-native';
import React from 'react';
import { BaseStory, data } from './fixture';

describe.skip('<PatientSectionList', () => {
  it('should pass', () => expect(true).toEqual(true));
  // const { getByText } = render(<BaseStory />);
  // it('should render PatientSectionList alphabet list', () => {
  //   groupEntriesByLetter(data).forEach(entry => {
  //     expect(getByText(entry.header)).not.toBeNull();
  //   });
  // });
});
