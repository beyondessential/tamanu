import React, { PropsWithChildren, ReactElement } from 'react';
import { StyledView, RowView } from '/styled/common';
import { SectionHeader } from '/components/SectionHeader';
import { EditButton } from './EditButton';

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
    <StyledView>
      <RowView justifyContent="space-between">
        <SectionHeader h1>{title}</SectionHeader>
        {onEdit && <EditButton onPress={onEdit} />}
      </RowView>
      {children}
    </StyledView>
  </StyledView>
);
