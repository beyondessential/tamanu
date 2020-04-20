import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { theme } from '/styled/theme';
import { StyledView } from '/styled/common';
import { IconWithSizeProps } from '../../interfaces/WithSizeProps';

interface WithBackground {
  background?: string;
}

type CheckedProps = IconWithSizeProps & WithBackground;

export const Checked = React.memo((props: CheckedProps) => (
  <StyledView
    background={props.background || theme.colors.WHITE}
    width={props.size}
    height={props.size}
    borderRadius={50}
    alignItems="center"
    justifyContent="center"
  >
    <Svg width="100%" height="100%" viewBox="0 0 16 16" {...props}>
      <Path
        d="M8 0C3.6 0 0 3.6 0 8C0 12.4 3.6 16 8 16C12.4 16 16 12.4 16 8C16 3.6 12.4 0 8 0ZM12.4667 5.8L7.13333 11.1333C7 11.2667 6.86667 11.3333 6.66667 11.3333C6.46667 11.3333 6.33333 11.2667 6.2 11.1333L3.53333 8.46667C3.26667 8.2 3.26667 7.8 3.53333 7.53333C3.8 7.26667 4.2 7.26667 4.46667 7.53333L6.66667 9.73333L11.5333 4.86667C11.8 4.6 12.2 4.6 12.4667 4.86667C12.7333 5.13333 12.7333 5.53333 12.4667 5.8Z"
        fill={props.fill ? props.fill : theme.colors.SAFE}
      />
    </Svg>
  </StyledView>
));
