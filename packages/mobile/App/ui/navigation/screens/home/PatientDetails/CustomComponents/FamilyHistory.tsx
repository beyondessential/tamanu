import { SectionHeader } from '/components/SectionHeader';
import { Separator } from '/components/Separator';
import { FamilyHistoryDataProps } from '/interfaces/PatientDetails';
import { RowView, StyledText, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import React, { ReactElement } from 'react';
import { Dot } from './Dot';
import { EditButton } from './EditButton';

interface FamilyHistoryProps extends FamilyHistoryDataProps {
  onEdit: () => void;
}

export const FamilyHistory = (props: FamilyHistoryProps): ReactElement => (
  <>
    <Separator width="100%" marginTop={20} />
    <StyledView marginTop={20}>
      <RowView alignItems="center" justifyContent="space-between">
        <SectionHeader h1>Family History</SectionHeader>
        <EditButton sectionTitle="Family History" onPress={props.onEdit} />
      </RowView>
      {props.familyHistory.data.length > 0
        && props.familyHistory.data.map((condition: string) => (
          <RowView key={condition} alignItems="center" marginTop={10}>
            <Dot />
            <StyledText marginLeft={10} color={theme.colors.TEXT_MID}>
              {condition}
            </StyledText>
          </RowView>
        ))}
    </StyledView>
  </>
);
