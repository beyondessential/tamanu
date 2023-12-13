import { StyledText, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { storiesOf } from '@storybook/react-native';
import React from 'react';
import { App, VaccineTabBaseStory } from './fixtures';

storiesOf('Top Tab', module)
  .addDecorator((getStory: Function) => (
    <StyledView flex={1}>
      <StyledView
        height={70}
        width="100%"
        background={theme.colors.PRIMARY_MAIN}
        justifyContent="center"
        paddingLeft={15}
      />
      <StyledView
        height={60}
        width="100%"
        background={theme.colors.PRIMARY_MAIN}
        paddingLeft={15}
      >
        <StyledText fontSize={28} fontWeight="bold" color={theme.colors.WHITE}>
          History
        </StyledText>
      </StyledView>
      {getStory()}
    </StyledView>
  ))
  .add('Common', () => <App />)
  .add('Vaccine Tab', () => <VaccineTabBaseStory />);
