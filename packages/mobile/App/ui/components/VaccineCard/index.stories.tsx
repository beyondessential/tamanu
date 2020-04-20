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
  takenOnTimeProps,
  takenNotOnScheduleProps,
  notTakenProps,
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
  .add('Taken', () => (
    <VaccineCard
      onEditDetails={mockEditDetails}
      onCloseModal={mockOnCloseModal}
      vaccineData={takenOnTimeProps}
    />
  ))
  .add('Taken not on Time', () => (
    <VaccineCard
      onEditDetails={mockEditDetails}
      onCloseModal={mockOnCloseModal}
      vaccineData={takenNotOnScheduleProps}
    />
  ))
  .add('Not Taken', () => (
    <VaccineCard
      onEditDetails={mockEditDetails}
      onCloseModal={mockOnCloseModal}
      vaccineData={notTakenProps}
    />
  ));
