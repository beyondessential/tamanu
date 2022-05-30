import React, { PropsWithChildren, ReactElement, useState } from 'react';
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
}: PropsWithChildren<PatientDetailSectionProps>): ReactElement => {
  const OverlapeddButton = (
    <StyledView alignItems="flex-end">
      <StyledView position="absolute" paddingTop={10} paddingRight={20}>
        <EditButton sectionTitle={title} onPress={onEdit} />
      </StyledView>
    </StyledView>
  );

  return (
    <StyledView>
      <RowView
        justifyContent="space-between"
        alignItems="center"
        background={theme.colors.WHITE}
        padding={20}
      >
        <SectionHeader h1>{title}</SectionHeader>
      </RowView>
      <>
        {onEdit && OverlapeddButton}
        {children}
      </>
    </StyledView>
  );
};
