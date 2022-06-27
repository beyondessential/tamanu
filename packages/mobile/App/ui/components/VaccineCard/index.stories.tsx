import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { ThemeProvider } from 'styled-components/native';
import {
  FullView,
  CenterView,
  themeSystem,
  StyledSafeAreaView,
} from '/styled/common';
import { theme } from '/styled/theme';
import { VaccineCard } from '.';
import {
  givenOnTimeProps,
  givenNotOnScheduleProps,
  notGivenProps,
} from './fixture';

const mockEditDetails = (): void => console.log('Navigate to edit details...');
const mockOnCloseModal = (): void => console.log('closing modal...');

storiesOf('VaccineCard', module)
  .addDecorator((Story: Function) => (
    <ThemeProvider theme={themeSystem}>
      <FullView background={theme.colors.MAIN_SUPER_DARK}>
        <CenterView flex={1}>
          <Story />
        </CenterView>
      </FullView>
    </ThemeProvider>
  ))
  .add('Given', () => (
    <VaccineCard
      onEditDetails={mockEditDetails}
      onCloseModal={mockOnCloseModal}
      vaccineData={givenOnTimeProps}
    />
  ))
  .add('Given not on Time', () => (
    <VaccineCard
      onEditDetails={mockEditDetails}
      onCloseModal={mockOnCloseModal}
      vaccineData={givenNotOnScheduleProps}
    />
  ))
  .add('Not Given', () => (
    <VaccineCard
      onEditDetails={mockEditDetails}
      onCloseModal={mockOnCloseModal}
      vaccineData={notGivenProps}
    />
  ));
