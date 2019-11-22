import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import theme from '../../styled/theme';

interface LabelProps {
  children: string;
  scale: Animated.AnimatedInterpolation;
  position: Animated.AnimatedInterpolation;
  focus: boolean;
  inputValue: string;
  error?: string;
  onFocus: Function;
}

const TextFieldLabel = ({
  children,
  scale,
  position,
  focus,
  onFocus,
  inputValue,
  error,
}: LabelProps) => {
  function getColor(value: string, error?: string) {
    if (!error && value.length === 0) return theme.colors.TEXT_SOFT;
    if (error) return theme.colors.ALERT;
    return theme.colors.TEXT_MID;
  }

  return (
    <Animated.Text
      onPress={() => onFocus(!focus)}
      style={[
        {
          ...AnimatedLabelStyles.label,
          color: getColor(inputValue, error),
        },
        { fontSize: scale, bottom: position },
      ]}>
      {children}
    </Animated.Text>
  );
};

const AnimatedLabelStyles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 5,
    paddingLeft: 9,
    position: 'absolute',
    zIndex: 2,
    color: theme.colors.TEXT_DARK,
  },
});

export default TextFieldLabel;
