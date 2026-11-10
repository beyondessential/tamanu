import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { ErrorToast } from './ErrorToast';

describe('<ErrorToast />', () => {
  it('closes when tapped', async () => {
    const onClose = jest.fn();
    const { getByText } = await render(
      <ErrorToast message="Not a valid QR code" onClose={onClose} />,
    );
    await fireEvent.press(getByText('Not a valid QR code'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on its own after a few seconds', async () => {
    const onClose = jest.fn();
    await render(<ErrorToast message="Not a valid QR code" onClose={onClose} />);
    await act(() => jest.advanceTimersByTime(4900));
    expect(onClose).not.toHaveBeenCalled();
    await act(() => jest.advanceTimersByTime(100));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
