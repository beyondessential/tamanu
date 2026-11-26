import React, { type ReactElement, type ReactNode, useEffect, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { CrossIcon } from './Icons';
import { StyledText } from '/styled/common';
import { theme } from '/styled/theme';

const AUTO_CLOSE_MS = 5000;

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 24,
    left: 12,
    right: 12,
    zIndex: 10,
    backgroundColor: theme.colors.ALERT_LIGHT,
    borderRadius: 3,
    paddingVertical: 11,
    paddingLeft: 16,
    paddingRight: 40,
    elevation: 4,
  },
  close: {
    position: 'absolute',
    top: 15,
    right: 16,
  },
});

interface ErrorToastProps {
  message: ReactNode;
  onClose: () => void;
}

export const ErrorToast = ({ message, onClose }: ErrorToastProps): ReactElement => {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const timer = setTimeout(() => onCloseRef.current(), AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Pressable style={styles.toast} onPress={onClose} accessibilityRole="alert">
      <StyledText fontSize={14} color={theme.colors.ALERT}>
        {message}
      </StyledText>
      <CrossIcon size={10} fill={theme.colors.ALERT} style={styles.close} />
    </Pressable>
  );
};
