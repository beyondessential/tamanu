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
      padding={20}
    >
      <SectionHeader h1>{title.toUpperCase()}</SectionHeader>
      {onEdit && <EditButton sectionTitle={title} onPress={onEdit} />}
    </RowView>
    {children}
  </StyledView>
);
