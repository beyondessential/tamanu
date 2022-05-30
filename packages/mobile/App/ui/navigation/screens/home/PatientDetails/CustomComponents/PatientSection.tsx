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
  };

  const overlappedButton = onEdit ? (
    <StyledView alignItems="flex-end">
      <StyledView position="absolute" paddingTop={10} paddingRight={20}>
        <EditButton sectionTitle={title} onPress={onEdit} />
      </StyledView>
    </StyledView>
  ) : null;

  const content = !isClosable || isOpen ? (
    <>
      {overlappedButton}
      {children}
    </>
  ) : null;

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
      {content}
    </StyledView>
  );
};
