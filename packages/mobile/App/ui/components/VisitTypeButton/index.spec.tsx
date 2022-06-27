import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { VisitTypeButton } from './index';
import { HeaderIcons, VisitTypes } from '/helpers/constants';

describe('<VisitTypeButton />', () => {
  const onPressMock = jest.fn();
  it('should render correctly', () => {
    const { getByText } = render(
      <VisitTypeButton
        Icon={HeaderIcons[VisitTypes.CLINIC]}
        type={VisitTypes.CLINIC}
        selected
        onPress={(): void => onPressMock()}
        title=''
        subtitle=''
      />
    );
    expect(getByText(VisitTypes.CLINIC)).not.toBeNull();
  });
  it('should call onPress', () => {
    const { getByText } = render(
      <VisitTypeButton
        Icon={HeaderIcons[VisitTypes.CLINIC]}
        type={VisitTypes.CLINIC}
        selected
        onPress={(): void => onPressMock()}
        title=''
        subtitle=''
      />
    );
    const textType = getByText(VisitTypes.CLINIC);
    fireEvent.press(textType);
    expect(onPressMock).toHaveBeenCalled();
  });
});
