import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { BaseStory } from './fixture';
import { SearchInput } from './index';

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
    expect(input.props.value).toBe(searchText);
  });

  it('shows the value on one line with an ellipsis while unfocused', async () => {
    const longValue = 'A very long search term that will not fit in the header';
    const { getByText, getByDisplayValue, queryByText } = await render(
      <SearchInput placeholder={props.placeholder} value={longValue} onChange={jest.fn()} />,
    );
    const truncated = getByText(longValue);
    expect(truncated.props.numberOfLines).toBe(1);
    expect(truncated.props.ellipsizeMode).toBe('tail');

    await fireEvent(getByDisplayValue(longValue), 'focus');
    expect(queryByText(longValue)).toBeNull();
  });

  it('hides the input behind the overlay again after focus and blur', async () => {
    const longValue = 'A very long search term that will not fit in the header';
    const { getByDisplayValue } = await render(
      <SearchInput placeholder={props.placeholder} value={longValue} onChange={jest.fn()} />,
    );
    const input = getByDisplayValue(longValue);
    await fireEvent(input, 'focus');
    await fireEvent(input, 'blur');
    expect(getByDisplayValue(longValue)).toHaveStyle({ opacity: 0 });
  });
});
