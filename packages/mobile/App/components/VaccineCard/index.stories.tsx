import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { ThemeProvider } from 'styled-components/native';
import { CenterView, themeSystem, StyledSafeAreaView } from '../../styled/common';
import { theme } from '../../styled/theme';
import { VaccineCard } from '.';
import { takenOnTimeProps, takenNotOnScheduleProps, notTakenProps } from './fixture';
import { VaccineModalForm } from '../Forms/VaccineModalForms';

const mockEditDetails = (): void => console.log('Navigate to edit details...');
const mockOnCloseModal = (): void => console.log('closing modal...');

storiesOf('VaccineCard', module)
  .addDecorator((Story: Function) => (
    <ThemeProvider theme={themeSystem}>
      <StyledSafeAreaView overflow="hidden" flex={1} background={theme.colors.MAIN_SUPER_DARK}>
        <CenterView>{Story()}</CenterView>
      </StyledSafeAreaView>
    </ThemeProvider>
  ))
  .add('Taken', () => (
    <VaccineCard
      onEditDetails={mockEditDetails}
      onCloseModal={mockOnCloseModal}
      vaccineData={takenOnTimeProps.vaccine}
    >
      <VaccineModalForm
        fieldOptions={takenOnTimeProps.fieldOptions}
        type={takenOnTimeProps.vaccine.status}
        initialValues={takenOnTimeProps.formProps.initialValues}
      />
    </VaccineCard>
  ))
  .add('Taken not on Time', () => (
    <VaccineCard
      onEditDetails={mockEditDetails}
      onCloseModal={mockOnCloseModal}
      vaccineData={takenNotOnScheduleProps.vaccine}
    >
      <VaccineModalForm
        fieldOptions={takenNotOnScheduleProps.fieldOptions}
        type={takenNotOnScheduleProps.vaccine.status}
        initialValues={takenNotOnScheduleProps.formProps.initialValues}
      />
    </VaccineCard>
  ))
  .add('Not Taken', () => (
    <VaccineCard
      onEditDetails={mockEditDetails}
      onCloseModal={mockOnCloseModal}
      vaccineData={notTakenProps.vaccine}
    >
      <VaccineModalForm
        fieldOptions={takenNotOnScheduleProps.fieldOptions}
        type={takenNotOnScheduleProps.vaccine.status}
        initialValues={takenNotOnScheduleProps.formProps.initialValues}
      />
    </VaccineCard>
  ));
