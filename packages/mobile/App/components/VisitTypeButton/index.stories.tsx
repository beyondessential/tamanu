import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { CenterView } from '../CenterView';
import { VisitTypeButton } from './index';
import { VisitTypes, HeaderIcons } from '../../helpers/constants';
import { VisitButtonList } from './fixture';

storiesOf('VisitTypeButton', module)
  .addDecorator((story: Function) => <CenterView>{story()}</CenterView>)
  .add('with icon selected', () => (
    <VisitTypeButton
      Icon={HeaderIcons[VisitTypes.CLINIC]}
      type={VisitTypes.CLINIC}
      selected
      onPress={() => console.log('with icon')}
    />
  ))
  .add('with icon unselected', () => (
    <VisitTypeButton
      Icon={HeaderIcons[VisitTypes.CLINIC]}
      type={VisitTypes.CLINIC}
      selected={false}
      onPress={() => console.log('with icon')}
    />
  ))
  .add('without icon unselected', () => (
    <VisitTypeButton
      title="ALL"
      subtitle="All types"
      selected={false}
      onPress={() => console.log('no icon')}
    />
  ))
  .add('without icon selected', () => (
    <VisitTypeButton
      title="ALL"
      subtitle="All types"
      selected
      onPress={() => console.log('no icon')}
    />
  ))
  .add('Button list', () => <VisitButtonList />);
