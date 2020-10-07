import React from 'react';
import { StyleSheet } from 'react-native';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { ColorHelper } from '/helpers/colors';
import { PractitionerView } from './PractitionerView';
import { MedicationList } from './MedicationList';
import { Diagnosis } from './Diagnosis';
import { TreatmentPlan } from './TreatmentPlan';
import { VisitOverviewProps } from '../../interfaces/VisitOverview';

export const VisitOverview = (section: VisitOverviewProps): JSX.Element => (
  <StyledView
    width="100%"
    height="100%"
    padding={20}
    borderBottomWidth={StyleSheet.hairlineWidth}
    borderColor={theme.colors.PRIMARY_MAIN}
  >
    {/** TODO: Move to encounter screen */}
    {/* <Diagnosis info={section.diagnosis} />
    <TreatmentPlan treatment={section.treament} />
    <MedicationList medications={section.medications} />
    <StyledView
      borderWidth={1}
      borderColor={ColorHelper.halfTransparency(theme.colors.TEXT_SOFT)}
      marginTop={20}
      marginBottom={20}
    />
    <PractitionerView name={section.practitioner.name} /> */}
    <StyledText>{JSON.stringify(section, null, 2)}</StyledText>
  </StyledView>
);
