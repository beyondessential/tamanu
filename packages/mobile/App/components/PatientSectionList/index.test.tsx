import React from 'react';
import { render } from '@testing-library/react-native';
import { BaseStory, data } from './fixture';
import { groupEntriesByLetter } from '../../helpers/list';

describe('<PatientSectionList', () => {
  const { getByText } = render(<BaseStory />);
  it('should render PatientSectionList alphabet list', () => {
    groupEntriesByLetter(data).forEach(entry => {
      expect(getByText(entry.header)).not.toBeNull();
    });
  });
});
