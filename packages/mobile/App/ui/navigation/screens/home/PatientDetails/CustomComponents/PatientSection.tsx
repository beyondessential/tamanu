import React, { PropsWithChildren, ReactElement } from 'react';
import { Separator } from '/components/Separator';
import { StyledView, RowView } from '/styled/common';
import { SectionHeader } from '/components/SectionHeader';
import { EditButton } from './EditButton';

interface PatientDetailSectionProps {
  hasSeparator: boolean;
  title: string;
  onEdit: () => void;
}

export const PatientSection = ({
  hasSeparator = false,
  title,
  onEdit,
  children,
}: PropsWithChildren<PatientDetailSectionProps>): ReactElement => (
  <StyledView marginTop={20}>
    {hasSeparator && <Separator width="100%" marginBottom={20} />}
    <StyledView>
      <RowView justifyContent="space-between">
        <SectionHeader h1>{title}</SectionHeader>
        <EditButton onPress={onEdit} />
      </RowView>
      {children}
    </StyledView>
  </StyledView>
);
