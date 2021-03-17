import React, { ReactElement } from 'react';
import { FamilyHistoryDataProps } from '/interfaces/PatientDetails';
import { Separator } from '/components/Separator';
import { StyledView, RowView, StyledText } from '/styled/common';
import { SectionHeader } from '/components/SectionHeader';
import { EditButton } from './EditButton';
import { Dot } from './Dot';
import { theme } from '/styled/theme';

interface FamilyHistoryProps extends FamilyHistoryDataProps {
  onEdit: () => void;
}

export const FamilyHistory = (props: FamilyHistoryProps): ReactElement => (
  <>
    <Separator width="100%" marginTop={20} />
    <StyledView marginTop={20}>
      <RowView alignItems="center" justifyContent="space-between">
        <SectionHeader h1>Family History</SectionHeader>
        <EditButton onPress={props.onEdit} />
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
