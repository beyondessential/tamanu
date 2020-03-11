import React, { ReactElement } from 'react';
import { OperativePlanDataProps } from '../../../../../interfaces/PatientDetails';
import { RowView, StyledText, StyledView } from '../../../../../styled/common';
import { Dot } from './Dot';
import { theme } from '../../../../../styled/theme';
import { PatientSection } from './PatientSection';


interface OperativePlanProps extends OperativePlanDataProps {
  onEdit: () => void;
}

export const OperativePlan = ({
  onEdit,
  operativePlan: { data },
}: OperativePlanProps): ReactElement => (
  <StyledView marginBottom={40 + data.length * 40}>
    <PatientSection
      hasSeparator
      title="Operative Plan"
      onEdit={onEdit}
    >
      {data.length > 0 && data.map((condition: string) => (
        <RowView key={condition} alignItems="center" marginTop={10}>
          <Dot /><StyledText marginLeft={10} color={theme.colors.TEXT_MID}>{condition}</StyledText>
        </RowView>
      )) }
    </PatientSection>
  </StyledView>
);
