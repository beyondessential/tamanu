import React, { useState, useRef } from 'react';
import Downshift from 'downshift';
import * as styles from './styles';
import { Animated, TextInput, KeyboardType } from 'react-native';
import TextFieldLabel from './TextFieldLabel';
import { StyledView } from '../../styled/common';

interface RefObject<T> {
  readonly current: T | null;
}

export interface BaseInputProps {
  value: string;
  onChangeText: (e: string) => void;
  isOpen?: boolean;
  label?: '' | string;
  keyboardType?: KeyboardType;
  placeholder?: '' | string;
  error?: '' | string;
}

const TextField = ({
  value,
  onChangeText,
  label,
  placeholder,
  error,
  keyboardType,
}: BaseInputProps) => {
  const [focused, setFocus] = useState(false);
  const [animated] = useState(new Animated.Value(0));
  const inputRef: RefObject<TextInput> = useRef(null);

  const onAnimateIn = () => {
    Animated.timing(animated, {
      toValue: 1,
      duration: 200,
    }).start();
  };

  const onAnimateOut = () => {
    Animated.timing(animated, {
      toValue: 0,
      duration: 200,
    }).start();
  };

  const scale = animated.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 10],
  });
  const bottom = animated.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 30],
  });

  const onFocusInput = () => {
    if (!focused) {
      inputRef.current!.focus();
    } else {
      inputRef.current!.blur();
    }
  };

  return (
    <Downshift
      inputValue={value}
      onInputValueChange={(text: string) => onChangeText(text)}>
      {({ getRootProps, getInputProps, inputValue }) => {
        return (
          <StyledView height="55" width="100%" {...getRootProps()}>
            <styles.InputContainer
              hasValue={value.length > 0}
              error={error}
              focused={focused}>
              {label ? (
                <TextFieldLabel
                  error={error}
                  focus={focused}
                  onFocus={onFocusInput}
                  scale={scale}
                  inputValue={value}
                  position={bottom}>
                  {label}
                </TextFieldLabel>
              ) : null}
              <styles.StyledTextInput
                ref={inputRef}
                keyboardType={keyboardType}
                {...getInputProps()}
                onFocus={() => {
                  setFocus(true);
                  onAnimateIn();
                }}
                onBlur={() => {
                  setFocus(false);
                  if (value.length === 0) {
                    onAnimateOut();
                  }
                }}
                placeholder={placeholder}
                value={inputValue as string}
              />
            </styles.InputContainer>
          </StyledView>
        );
      }}
    </Downshift>
  );
};

export default TextField;
