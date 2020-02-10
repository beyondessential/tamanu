
import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { StyledView, CenterView } from '../../styled/common';
import { Info } from './index';

storiesOf('Info', module)
  .addDecorator((Story: Function) => (
    <StyledView flex={1}>
      <CenterView>
        {Story()}
      </CenterView>
    </StyledView>
  ))
  .add('example', () => <Info text="Please update Batch No, Manufacture in mSupply" />);
