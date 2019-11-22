import React, { useState, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Downshift from 'downshift';
import * as styles from '../TextField/styles';
import { Animated } from 'react-native';
import TextFieldLabel from '../TextField/TextFieldLabel';
import {
  TextInputMask,
  TextInputMaskOptionProp,
  TextInputMaskTypeProp,
} from 'react-native-masked-text';
import theme from '../../styled/theme';
import { StyledView } from '../../styled/common';
import { BaseInputProps } from '../TextField/TextField';

export interface MaskedInputProps extends BaseInputProps {
  masked?: boolean;
  maskType?: TextInputMaskTypeProp;
  options?: TextInputMaskOptionProp;
  width?: string | number;
}

const MaskedTextField = ({
  value,
  onChangeText,
  label,
  error,
  maskType,
  options,
  keyboardType,
  width = '100%',
}: MaskedInputProps) => {
  const [focused, setFocus] = useState(false);
  const [animated] = useState(new Animated.Value(0));
  let maskedInputRef: any = useRef(null);

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
      maskedInputRef.current._inputElement.focus();
    } else {
      maskedInputRef.current._inputElement.blur();
    }
  };

  return (
    <Downshift
      inputValue={value}
      onInputValueChange={(text: string) => onChangeText(text)}>
      {({ getRootProps, getInputProps }) => {
        return (
          <StyledView width={width} height={'55px'} {...getRootProps()}>
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
              <TextInputMask
                ref={maskedInputRef}
                value={value}
                type={maskType}
                keyboardType={keyboardType}
                options={options}
                style={MaskedStyles.styles}
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
                {...getInputProps()}
              />
            </styles.InputContainer>
          </StyledView>
        );
      }}
    </Downshift>
  );
};

const MaskedStyles = StyleSheet.create({
  styles: {
    height: 55,
    width: '100%',
    fontSize: 18,
    lineHeight: 21,
    fontWeight: '400',
    color: theme.colors.TEXT_DARK,
    paddingLeft: 10,
    paddingTop: 8,
  },
});

export default MaskedTextField;
