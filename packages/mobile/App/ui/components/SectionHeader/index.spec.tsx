import React from 'react';
import { render } from '@testing-library/react-native';
import { SectionHeader } from './index';

describe('<SectionHeader />', () => {
  const h1Text = 'General Information';

  it('should render correctly', async () => {
    const { getByText } = await render(<SectionHeader h1>{h1Text}</SectionHeader>);
    expect(getByText(h1Text)).not.toBeNull();
  });
});
