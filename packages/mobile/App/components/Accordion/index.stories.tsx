import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { CenterView } from '../../styled/common';
import { AccordionList } from './index';
import { data } from './fixtures';

storiesOf('Accordion', module)
  .addDecorator((getStory: any) => <CenterView flex={1}>{getStory()}</CenterView>)
  .add('List', () => <AccordionList dataArray={data} />);
