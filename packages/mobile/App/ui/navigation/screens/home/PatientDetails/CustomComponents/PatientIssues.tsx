import React, { ReactElement } from 'react';
import { PatientIssuesDataProps } from '/interfaces/PatientDetails';
import { RowView, StyledText, StyledView } from '/styled/common';
import { Dot } from './Dot';
import { theme } from '/styled/theme';
import { PatientSection } from './PatientSection';

interface PatientIssuesProps extends PatientIssuesDataProps {
  onEdit: () => void;
}

export const PatientIssues = ({
  onEdit,
  patientIssues,
}: PatientIssuesProps): ReactElement => {
  return (
    <StyledView marginBottom={40}>
      <PatientSection hasSeparator title="Other patient issues" onEdit={onEdit}>
        {patientIssues.map(({ id, note }) => (
          <RowView key={id} alignItems="center" marginTop={10}>
            <Dot />
            <StyledText marginLeft={10} color={theme.colors.TEXT_MID}>
              {note}
            </StyledText>
          </RowView>
        ))}
      </PatientSection>
    </StyledView>
  );
};
