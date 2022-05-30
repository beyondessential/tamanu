import React, { PropsWithChildren, ReactElement, useState } from 'react';
import { StyledView, RowView } from '/styled/common';
import { SectionHeader } from '/components/SectionHeader';
import { EditButton } from './EditButton';
import { theme } from '/styled/theme';
import { ArrowButton } from './ArrowButton';

interface PatientDetailSectionProps {
  title: string;
  onEdit?: () => void;
  isClosable?: boolean;
}

export const PatientSection = ({
  title,
  onEdit,
  isClosable = false,
  children,
}: PropsWithChildren<PatientDetailSectionProps>): ReactElement => {
  // Closable sections should be closed by default
  const [isOpen, setIsOpen] = useState(false);
  const toggleSection = (): void => {
    setIsOpen(prevValue => !prevValue);
  }

  const OverlapeddButton = (
    <StyledView alignItems="flex-end">
      <StyledView position="absolute" paddingTop={10} paddingRight={20}>
        <EditButton sectionTitle={title} onPress={onEdit} />
      </StyledView>
    </StyledView>
  );

  const content = (
    <>
      {onEdit && OverlapeddButton}
      {children}
    </>
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
        {isClosable && <ArrowButton isOpen={isOpen} sectionTitle={title} onPress={toggleSection} />}
      </RowView>
      {!isClosable || isOpen ? content : null}
    </StyledView>
  );
};
