import React, { ReactElement } from 'react';
import { OnGoingConditionsDataProps } from '/interfaces/PatientDetails';
import { RowView, StyledText } from '/styled/common';
import { Dot } from './Dot';
import { theme } from '/styled/theme';
import { PatientSection } from './PatientSection';

interface OnGoingConditionsProps extends OnGoingConditionsDataProps {
  onEdit: () => void;
}

export const OnGoingConditions = (
  props: OnGoingConditionsProps,
): ReactElement => (
  <PatientSection onEdit={props.onEdit} title="Ongoing Conditions" hasSeparator>
    {props.ongoingConditions.data.map((condition: string) => (
      <RowView key={condition} alignItems="center" marginTop={10}>
        <Dot />
        <StyledText marginLeft={10} color={theme.colors.TEXT_MID}>
          {condition}
        </StyledText>
      </RowView>
    ))}
  </PatientSection>
);
