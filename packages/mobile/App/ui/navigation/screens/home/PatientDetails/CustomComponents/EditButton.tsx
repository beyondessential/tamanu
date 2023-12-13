import { PencilIcon } from '/components/Icons';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { StyledTouchableOpacity } from '/styled/common';
import { kebabCase } from 'lodash';
import React, { ReactElement } from 'react';

interface EditButtonProps {
  sectionTitle: string;
  onPress: () => void;
}

export const EditButton = ({ sectionTitle, onPress }: EditButtonProps): ReactElement => (
  <StyledTouchableOpacity
    testID={`edit-${kebabCase(sectionTitle)}`}
    accessibilityLabel={`Edit ${sectionTitle}`}
    onPress={onPress}
  >
    <PencilIcon
      height={screenPercentageToDP('2.5', Orientation.Height)}
      width={screenPercentageToDP('2.5', Orientation.Height)}
    />
  </StyledTouchableOpacity>
);
