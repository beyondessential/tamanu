import React from 'react';
import { StyledView, RowView, StyledText } from '/styled/common';
import { ColorHelper } from '/helpers/colors';
import { theme } from '/styled/theme';
import { MedicationProps } from '../../interfaces/MedicationProps';

interface MedicationListItemProps {
  name: string;
  index: number;
}

const MedicationListItem = ({
  name,
  index,
}: MedicationListItemProps): JSX.Element => (
    <StyledView>
      <RowView alignItems="center" marginTop={10}>
        <StyledView
          height={5}
          width={5}
          marginRight={10}
          borderRadius={50}
          background={ColorHelper.halfTransparency(theme.colors.TEXT_MID)}
        />
        <StyledText color={theme.colors.TEXT_MID}>
          {`Medication ${index}`}
        </StyledText>
      </RowView>
      <StyledView marginLeft={15} marginTop={10}>
        <StyledText color={theme.colors.TEXT_MID}>{name}</StyledText>
      </StyledView>
    </StyledView>
  );

export const MedicationList = ({
  medications,
}: {
  medications: MedicationProps[];
}): JSX.Element => (
    <StyledView marginTop={20}>
      <StyledText fontSize={14} fontWeight={500}>
        Medication
    </StyledText>
      {medications.map((medicationItem, index) => (
        <MedicationListItem
          key={medicationItem.id}
          name={medicationItem.name}
          index={index}
        />
      ))}
    </StyledView>
  );
