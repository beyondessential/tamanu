import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { VisitTypeButton } from './index';
import { HeaderIcons, VisitTypes } from '/helpers/constants';

describe('<VisitTypeButton />', () => {
  const onPressMock = jest.fn();
  it('should render correctly', async () => {
    const { getByText } = await render(
      <VisitTypeButton
        Icon={HeaderIcons[VisitTypes.CLINIC]}
        type={VisitTypes.CLINIC}
        selected
        onPress={(): void => onPressMock()}
        title=''
        subtitle=''
      />,
    );
    expect(getByText(VisitTypes.CLINIC)).not.toBeNull();
  });
  it('should call onPress', async () => {
    const { getByText } = await render(
      <VisitTypeButton
        Icon={HeaderIcons[VisitTypes.CLINIC]}
        type={VisitTypes.CLINIC}
        selected
        onPress={(): void => onPressMock()}
        title=''
        subtitle=''
      />,
    );
    const textType = getByText(VisitTypes.CLINIC);
    await fireEvent.press(textType);
    expect(onPressMock).toHaveBeenCalled();
  });
});
