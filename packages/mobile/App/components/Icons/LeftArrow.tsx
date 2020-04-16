import React, { memo } from 'react';
import Svg, { Path } from 'react-native-svg';
import { StyledView } from '/styled/common';
import { IconWithSizeProps } from '../../interfaces/WithSizeProps';
import { screenPercentageToDP, Orientation } from '../../helpers/screen';

const standardSize = screenPercentageToDP(2.43, Orientation.Height);

export const LeftArrow = memo(
  ({ size = standardSize, ...props }: IconWithSizeProps) => (
    <StyledView height={size} width={size}>
      <Svg width="100%" height="100%" viewBox="0 0 20 15" {...props}>
        <Path
          d="M19.1831 6.86078H2.95812L7.81 1.84266C8.12875 1.53578 8.12875 1.03703 7.81 0.730156C7.49125 0.423281 6.975 0.423281 6.65688 0.730156L0 7.66391L6.55375 14.6464C6.71313 14.8008 6.92188 14.8783 7.13 14.8783C7.33813 14.8783 7.54813 14.8014 7.70688 14.6464C8.02625 14.3395 8.02625 13.842 7.70688 13.5352L2.905 8.43453H19.1831C19.6344 8.43453 20 8.08266 20 7.64703C20 7.21266 19.6344 6.86078 19.1831 6.86078Z"
          fill="white"
        />
      </Svg>
    </StyledView>
  ),
);
