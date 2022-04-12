import React, { ReactElement } from 'react';
import { StyledTouchableOpacity } from '/styled/common';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { PencilIcon } from '/components/Icons';

interface EditButtonProps {
  sectionTitle: string;
  onPress: () => void;
}

const createTestID = (sectionTitle: string): string => {
  const lowercaseSectionTitle = sectionTitle.toLowerCase();

  // Adds 'edit' prefix and replaces spaces for hyphens
  return `edit-${lowercaseSectionTitle.replace(/ /g, '-')}`;
};

export const EditButton = ({ sectionTitle, onPress }: EditButtonProps): ReactElement => (
  <StyledTouchableOpacity
    testID={createTestID(sectionTitle)}
    accessibilityLabel={`Edit ${sectionTitle}`}
    onPress={onPress}
  >
    <PencilIcon
      height={screenPercentageToDP('2.5', Orientation.Height)}
      width={screenPercentageToDP('2.5', Orientation.Height)}
    />
  </StyledTouchableOpacity>
);
