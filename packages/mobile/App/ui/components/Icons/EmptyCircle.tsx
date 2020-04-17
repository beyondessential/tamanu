import React from 'react';
import Svg, { Circle, SvgProps } from 'react-native-svg';
import { StyledView } from '/styled/common';
import { IconWithSizeProps } from '../../interfaces/WithSizeProps';

export const EmptyCircle = React.memo((props: IconWithSizeProps) => (
  <StyledView height={props.size} width={props.size}>
    <Svg width="100%" height="100%" viewBox="0 0 34 34" fill="none" {...props}>
      <Circle
        cx="17"
        cy="17"
        r="16"
        fill="white"
        stroke="#DEDEDE"
        stroke-width="2"
      />
    </Svg>
  </StyledView>
));
