import { act } from '@testing-library/react-hooks';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { BaseStory } from './fixture';

describe('<SearchInput />', () => {
  const props = {
    placeholder: 'Search for patients',
  };

  it('should render correctly', () => {
    const { getByPlaceholderText } = render(<BaseStory />);
    expect(getByPlaceholderText(props.placeholder)).not.toBeNull();
  });

  it('should change value', () => {
    const searchText = 'patient0';
    const { getByPlaceholderText } = render(<BaseStory />);
    const input = getByPlaceholderText(props.placeholder);
    act(() => {
      fireEvent.changeText(input, searchText);
    });
    expect(input.props['value']).toBe(searchText);
  });
});
