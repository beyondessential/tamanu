import React, {
  isValidElement,
  PropsWithChildren,
  ReactElement,
  ReactNode,
  useState,
} from 'react';
import { View } from 'react-native';
import { RowView } from '/styled/common';
import { SectionHeader } from '/components/SectionHeader';
import { EditButton } from './EditButton';
import { theme } from '/styled/theme';
import { ArrowButton } from './ArrowButton';
import { TranslatedTextProps } from '~/ui/contexts/TranslationContext';

interface PatientDetailSectionProps {
  title: ReactNode;
  onEdit?: () => void;
  isClosable?: boolean;
}

function getSectionLabel(title: ReactNode): string {
  if (typeof title === 'string') {
    return title;
  }

  if (isValidElement<TranslatedTextProps>(title)) {
    return title.props.fallback;
  }

  return '';
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

  const sectionLabel = getSectionLabel(title);

  return (
    <View>
      <RowView
        justifyContent="space-between"
        alignItems="center"
        background={theme.colors.WHITE}
        padding={20}
      >
        <SectionHeader h1>{title}</SectionHeader>
        <RowView alignItems="center">
          {onEdit && isOpen && <EditButton sectionTitle={sectionLabel} onPress={onEdit} />}
          {isClosable && (
            <ArrowButton isOpen={isOpen} sectionTitle={sectionLabel} onPress={toggleSection} />
          )}
        </RowView>
      </RowView>
      {isOpen && children}
    </View>
  );
};
