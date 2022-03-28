import React, { ReactElement } from 'react';
import { AllergiesProps } from '/interfaces/PatientDetails';
import { RowView, StyledText, StyledView } from '/styled/common';
import { Dot } from './Dot';
import { theme } from '/styled/theme';
import { PatientSection } from './PatientSection';

interface Allergies extends AllergiesProps {
  onEdit: () => void;
}

export const AllergiesList = ({
  onEdit,
  allergies: { data },
}: Allergies): ReactElement => (
  <StyledView>
    <PatientSection hasSeparator title="Allergies" onEdit={onEdit}>
      {data.length > 0
        && data.map((condition: string) => (
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
