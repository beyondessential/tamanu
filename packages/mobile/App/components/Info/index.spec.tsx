import React from 'react';
import { render } from '@testing-library/react-native';
import { Info } from './index';

describe('<Info />', () => {
  const text = 'example';
  const { getByText } = render(<Info text={text} />);

  it('should render <Info />', () => {
    expect(getByText(text)).not.toBeNull();
  });
});
