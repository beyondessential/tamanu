import React, { ReactElement } from 'react';
import { StyledTouchableOpacity } from '/styled/common';
import { kebabCase } from 'lodash';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { ArrowDownIcon, ArrowUpIcon } from '/components/Icons';
import { theme } from '/styled/theme';

interface ArrowButtonProps {
  isOpen: boolean;
  sectionTitle: string;
  onPress: () => void;
}

export const ArrowButton = ({ isOpen, sectionTitle, onPress }: ArrowButtonProps): ReactElement => {
  const CurrentArrowIcon = isOpen ? ArrowUpIcon : ArrowDownIcon;

  return (
    <StyledTouchableOpacity
      testID={`toggle-${kebabCase(sectionTitle)}`}
      accessibilityLabel={`Toggle ${sectionTitle}`}
      onPress={onPress}
    >
      <CurrentArrowIcon
        height={screenPercentageToDP('2.5', Orientation.Height)}
        width={screenPercentageToDP('2.5', Orientation.Height)}
        fill={theme.colors.PRIMARY_MAIN}
      />
    </StyledTouchableOpacity>
  );
}
