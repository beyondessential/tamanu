import React, { ReactElement } from 'react';
import { ProcedurePlanDataProps } from '/interfaces/PatientDetails';
import { RowView, StyledText, StyledView } from '/styled/common';
import { Dot } from './Dot';
import { theme } from '/styled/theme';
import { PatientSection } from './PatientSection';

interface ProcedurePlanProps extends ProcedurePlanDataProps {
  onEdit: () => void;
}

export const ProcedurePlan = ({
  onEdit,
  procedurePlan: { data },
}: ProcedurePlanProps): ReactElement => (
  <StyledView marginBottom={40 + data.length * 40}>
    <PatientSection hasSeparator title="Procedure Plan" onEdit={onEdit}>
      {data.length > 0 &&
        data.map((condition: string) => (
          <RowView key={condition} alignItems="center" marginTop={10}>
            <Dot />
            <StyledText marginLeft={10} color={theme.colors.TEXT_MID}>
              {condition}
            </StyledText>
          </RowView>
        ))}
    </PatientSection>
  </StyledView>
);
