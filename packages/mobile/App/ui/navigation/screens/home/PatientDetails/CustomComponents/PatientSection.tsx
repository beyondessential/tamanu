import React, { PropsWithChildren, ReactElement } from 'react';
import { StyledView, RowView } from '/styled/common';
import { SectionHeader } from '/components/SectionHeader';
import { EditButton } from './EditButton';
import { theme } from '/styled/theme';

interface PatientDetailSectionProps {
  title: string;
  onEdit?: () => void;
}

export const PatientSection = ({
  title,
  onEdit,
  children,
}: PropsWithChildren<PatientDetailSectionProps>): ReactElement => (
  <StyledView>
    <RowView
      justifyContent="space-between"
      alignItems="center"
      background={theme.colors.WHITE}
      paddingTop={10}
      paddingBottom={10}
      paddingLeft={20}
      paddingRight={20}
    >
      <SectionHeader h1>{title}</SectionHeader>
      {onEdit && <EditButton onPress={onEdit} />}
    </RowView>
    {children}
  </StyledView>
);
