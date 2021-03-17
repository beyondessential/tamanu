import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { VisitTypeButton } from './index';
import { HeaderIcons, VisitTypes } from '/helpers/constants';

describe('<VisitTypeButton />', () => {
  const onPressMock = jest.fn();
  const { getByText } = render(
    <VisitTypeButton
      Icon={HeaderIcons[VisitTypes.CLINIC]}
      type={VisitTypes.CLINIC}
      selected
      onPress={(): void => onPressMock()}
      title=""
      subtitle=""
    />,
  );
  it('should render correctly', () => {
    expect(getByText(VisitTypes.CLINIC)).not.toBeNull();
  });
  it('should call onPress', () => {
    const textType = getByText(VisitTypes.CLINIC);
    fireEvent.press(textType);
    expect(onPressMock).toHaveBeenCalled();
  });
});
