import React, { ReactNode } from 'react';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { StyledTouchableOpacity, StyledView } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { CrossIcon } from './Icons';

export enum AlertSeverity {
  Info = 'info',
  Error = 'error',
  Warning = 'warning',
}

type SyncInactiveBannerProps = {
  severity?: AlertSeverity;
  children: ReactNode;
  open: boolean;
  onClose: () => void;
};

const SEVERITY_TO_COLORS: {
  [key in AlertSeverity]: {
    background: string;
    color: string;
  };
} = {
  info: {
    background: 'rgba(50, 102, 153, 0.2)',
    color: theme.colors.PRIMARY_MAIN,
  },
  error: {
    background: 'rgba(247, 231, 231, 1)',
    color: theme.colors.ALERT,
  },
  warning: {
    background: '#FCF8E2',
    color: '#8B6E37',
  },
};

export const Alert = ({
  severity = AlertSeverity.Info,
  children,
  open,
  onClose
}: SyncInactiveBannerProps): JSX.Element => {
  const { background, color } = SEVERITY_TO_COLORS[severity];

  if (!open) return null;

  return (
    <StyledView
      padding={screenPercentageToDP(3.6, Orientation.Width)}
    >
      <StyledView
        width="100%"
        height={screenPercentageToDP(6, Orientation.Height)}
        background={background}
        borderRadius={3}
        borderWidth={1}
        flexDirection="row"
        borderColor={color}
        alignItems="center"
        paddingLeft={screenPercentageToDP(3, Orientation.Width)}
        paddingRight={screenPercentageToDP(3, Orientation.Width)}
      >
        {children}
        <StyledView flexGrow={1} />
        <StyledTouchableOpacity width={20} onPress={onClose}>
          <CrossIcon fill={color} size={screenPercentageToDP(3, Orientation.Width)} />
        </StyledTouchableOpacity>
      </StyledView>
    </StyledView>
  );
};
