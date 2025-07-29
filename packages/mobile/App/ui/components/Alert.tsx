import React, { ReactNode } from 'react';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { StyledTouchableOpacity, StyledView } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { CrossIcon } from './Icons';

export const AlertSeverity = {
  Info: 'info',
  Error: 'error',
  Warning: 'warning',
} as const;
export type AlertSeverity = (typeof AlertSeverity)[keyof typeof AlertSeverity];

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
    background: '#dce3ec',
    color: theme.colors.PRIMARY_MAIN,
  },
  error: {
    background: '#f7e7e7',
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
