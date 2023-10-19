import React, { PropsWithChildren, ReactElement, useState } from 'react';
import { StyledView, RowView } from '/styled/common';
import { SectionHeader } from '/components/SectionHeader';
import { theme } from '/styled/theme';
import { EditButton } from '../home/PatientDetails/CustomComponents';
import { Button } from '~/ui/components/Button';
import { IconButton } from 'react-native-paper';
import { CircleAdd } from '~/ui/components/Icons';

interface AddPatientProgramRegistryButtonProps {
  title: string;
  onEdit?: () => void;
  isClosable?: boolean;
}

export const AddPatientProgramRegistryButton = ({
  title,
  onEdit,
  isClosable = false,
  children,
}: PropsWithChildren<AddPatientProgramRegistryButtonProps>): ReactElement => {
  // Closable sections should be closed by default. Modifying the
  // state won't be possible for unclosable sections.
  const [isOpen, setIsOpen] = useState(!isClosable);
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

  const content = isOpen ? (
    <>
      {overlappedButton}
      {children}
    </>
  ) : null;

  return (
    <StyledView margin={20} borderRadius={5}>
      <RowView
        justifyContent="space-between"
        alignItems="center"
        background={theme.colors.WHITE}
        padding={20}
      >
        <SectionHeader h1 fontSize={14} fontWeight={500} color={theme.colors.BLACK}>
          {title}
        </SectionHeader>
        <Button
          backgroundColor={theme.colors.PRIMARY_MAIN}
          borderRadius={100}
          width={32}
          height={32}
          onPress={() => {
            console.log('meo meo meo');
          }}
        >
          <CircleAdd size={32} />
        </Button>
      </RowView>
      {content}
    </StyledView>
  );
};
