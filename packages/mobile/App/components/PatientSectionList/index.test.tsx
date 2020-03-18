import React from 'react';
import { render } from '@testing-library/react-native';
import { groupEntriesByLetter } from '/helpers/list';
import { BaseStory, data } from './fixture';

describe('<PatientSectionList', () => {
  const { getByText } = render(<BaseStory />);
  it('should render PatientSectionList alphabet list', () => {
    groupEntriesByLetter(data).forEach(entry => {
      expect(getByText(entry.header)).not.toBeNull();
    });
  });
});
