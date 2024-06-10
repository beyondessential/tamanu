import React, { ReactElement } from 'react';
import { StyledTouchableOpacity } from '/styled/common';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { PencilIcon } from '/components/Icons';

interface EditButtonProps {
  sectionTitle: Element;
  onPress: () => void;
}

export const EditButton = ({ sectionTitle, onPress }: EditButtonProps): ReactElement => (
  <StyledTouchableOpacity
    testID={`editbutton-${sectionTitle}`}
    accessibilityLabel={`Edit ${sectionTitle}`}
    onPress={onPress}
  >
    <PencilIcon
      height={screenPercentageToDP('2.5', Orientation.Height)}
      width={screenPercentageToDP('2.5', Orientation.Height)}
    />
  </StyledTouchableOpacity>
);
