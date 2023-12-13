import { HeaderIcons, VisitTypes } from '/helpers/constants';
import { CenterView } from '/styled/common';
import { storiesOf } from '@storybook/react-native';
import React from 'react';
import { VisitButtonList } from './fixture';
import { VisitTypeButton } from './index';

storiesOf('VisitTypeButton', module)
  .addDecorator((story: Function) => <CenterView flex={1}>{story()}</CenterView>)
  .add('with icon selected', () => (
    <VisitTypeButton
      Icon={HeaderIcons[VisitTypes.CLINIC]}
      type={VisitTypes.CLINIC}
      selected
      onPress={(): void => console.log('with icon')}
      title=""
      subtitle=""
    />
  ))
  .add('with icon unselected', () => (
    <VisitTypeButton
      Icon={HeaderIcons[VisitTypes.CLINIC]}
      type={VisitTypes.CLINIC}
      selected={false}
      onPress={(): void => console.log('with icon')}
      title=""
      subtitle=""
    />
  ))
  .add('Button list', () => <VisitButtonList />);
