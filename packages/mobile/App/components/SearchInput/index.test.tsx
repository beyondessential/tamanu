import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BaseStory } from './fixture';

describe('<SearchInput />', () => {
  const props = {
    placeholder: 'Search for patients',
  };
  const searchText = 'patient0';
  const { getByPlaceholderText } = render(<BaseStory />);
  it('should render correctly', () => {
    expect(getByPlaceholderText(props.placeholder)).not.toBeNull();
  });

  it('should change value', () => {
    const input = getByPlaceholderText(props.placeholder);
    fireEvent.changeText(input, searchText);
    expect(input.getProp('value')).toBe(searchText);
  });
});
