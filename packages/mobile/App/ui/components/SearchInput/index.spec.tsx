import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { BaseStory } from './fixture';

describe('<SearchInput />', () => {
  const props = {
    placeholder: 'Search for patients',
  };

  it('should render correctly', async () => {
    const { getByPlaceholderText } = await render(<BaseStory />);
    expect(getByPlaceholderText(props.placeholder)).not.toBeNull();
  });

  it('should change value', async () => {
    const searchText = 'patient0';
    const { getByPlaceholderText } = await render(<BaseStory />);
    const input = getByPlaceholderText(props.placeholder);
    await fireEvent.changeText(input, searchText);
    expect(input.props['value']).toBe(searchText);
  });
});
