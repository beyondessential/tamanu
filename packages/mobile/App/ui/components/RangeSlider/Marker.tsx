import React, { useMemo } from 'react';
import { StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';

interface MarkerProps {
  pressed: boolean;
}

export const Marker = ({ pressed }: MarkerProps): Element => {
  const SIZE_LARGE = useMemo(
    () => screenPercentageToDP('3.03', Orientation.Height),
    [],
  );
  const SIZE_SMALL = useMemo(
    () => screenPercentageToDP('3.64', Orientation.Height),
    [],
  );

  return (
    <StyledView
      height={pressed ? SIZE_SMALL : SIZE_LARGE}
      width={pressed ? SIZE_SMALL : SIZE_LARGE}
      borderRadius={50}
      background={theme.colors.BOX_OUTLINE}
      justifyContent="center"
      alignItems="center"
    >
      <StyledView
        height="90%"
        width="90%"
        borderRadius={50}
        background={theme.colors.WHITE}
      />
    </StyledView>
  );
};
