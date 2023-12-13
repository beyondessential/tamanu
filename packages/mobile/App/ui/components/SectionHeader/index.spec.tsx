import { render } from '@testing-library/react-native';
import React from 'react';
import { SectionHeader } from './index';

describe('<SectionHeader />', () => {
  const h1Text = 'General Information';
  const { getByText } = render(<SectionHeader h1>{h1Text}</SectionHeader>);
  it('should render correctly', () => {
    expect(getByText(h1Text)).not.toBeNull();
  });
});
