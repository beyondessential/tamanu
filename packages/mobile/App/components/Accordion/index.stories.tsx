import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { CenterView } from '../../styled/common';
import Accordion from './index';
import { data } from './fixtures';

storiesOf('Accordion', module)
  .addDecorator((getStory: any) => <CenterView>{getStory()}</CenterView>)
  .add('List', () => <Accordion dataArray={data} />);
