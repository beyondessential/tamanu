import React from 'react';
import { ThemeProvider } from 'styled-components';
import { RowView, StyledView, themeSystem } from '/styled/common';
import { PatientMenuButton } from './index';
import {
  SickOrInjured,
  CheckUp,
  Pregnancy,
  FamilyPlanning,
  Vaccine,
  Deceased,
} from '../Icons';

export const BaseStory = (): JSX.Element => (
  <ThemeProvider theme={themeSystem}>
    <StyledView width="100%">
      <RowView width="100%" paddingLeft={15} paddingRight={15}>
        <PatientMenuButton
          title={'Sick \n or Injured'}
          Icon={SickOrInjured}
          onPress={(): void => console.log('here')}
        />
        <StyledView marginLeft={8} marginRight={8}>
          <PatientMenuButton
            title="Check up"
            Icon={CheckUp}
            onPress={(): void => console.log('here')}
          />
        </StyledView>
        <PatientMenuButton
          title="Programs"
          Icon={Pregnancy}
          onPress={(): void => console.log('here')}
        />
      </RowView>
      <RowView width="100%" marginTop={8} paddingLeft={15} paddingRight={15}>
        <PatientMenuButton
          title="Referral"
          Icon={FamilyPlanning}
          onPress={(): void => console.log('here')}
        />
        <StyledView marginLeft={8} marginRight={8}>
          <PatientMenuButton
            title="Vaccine"
            Icon={Vaccine}
            onPress={(): void => console.log('here')}
          />
        </StyledView>
        <PatientMenuButton
          title="Deceased"
          Icon={Deceased}
          onPress={(): void => console.log('here')}
        />
      </RowView>
    </StyledView>
  </ThemeProvider>
);
