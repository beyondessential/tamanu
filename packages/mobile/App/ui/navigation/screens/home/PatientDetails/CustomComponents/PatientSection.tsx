import { SectionHeader } from '/components/SectionHeader';
import { RowView, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import React, { PropsWithChildren, ReactElement, useState } from 'react';
import { ArrowButton } from './ArrowButton';
import { EditButton } from './EditButton';

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
  // Closable sections should be closed by default. Modifying the
  // state won't be possible for unclosable sections.
  const [isOpen, setIsOpen] = useState(!isClosable);
  const toggleSection = (): void => {
    setIsOpen(prevValue => !prevValue);
  };

  const overlappedButton = onEdit ?
    (
      <StyledView alignItems="flex-end">
        <StyledView position="absolute" paddingTop={10} paddingRight={20}>
          <EditButton sectionTitle={title} onPress={onEdit} />
        </StyledView>
      </StyledView>
    ) :
    null;

  const content = isOpen ?
    (
      <>
        {overlappedButton}
        {children}
      </>
    ) :
    null;

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
