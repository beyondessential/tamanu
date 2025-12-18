import React, { FunctionComponent, useCallback } from 'react';
import { SvgProps } from 'react-native-svg';
import { StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { StyledText, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { GivenOnTimeIcon } from '../Icons';

interface VisitTypeButtonProps {
  type?: string;
  selected: boolean;
  title: string;
  subtitle: string;
  Icon: FunctionComponent<SvgProps>;
  onPress: (type: string) => void;
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
});

export const VisitTypeButton = ({
  Icon,
  type = '',
  selected,
  title,
  subtitle,
  onPress,
}: VisitTypeButtonProps): JSX.Element => {
  const onButtonPress = useCallback(() => {
    onPress(type);
  }, [onPress, type]);
  return (
    <TouchableWithoutFeedback onPress={onButtonPress} style={styles.container}>
      <StyledView alignItems="center">
        <StyledView
          height={57}
          width={57}
          borderRadius={50}
          background={selected ? theme.colors.MAIN_SUPER_DARK : 'transparent'}
          borderWidth={1}
          borderColor={
            selected ? theme.colors.MAIN_SUPER_DARK : theme.colors.PRIMARY_MAIN
          }
          justifyContent="center"
          alignItems="center"
        >
          {Icon && (
            <Icon
              height={25}
              width={25}
              fill={selected ? theme.colors.WHITE : theme.colors.PRIMARY_MAIN}
            />
          )}
          {selected && (
            <StyledView position="absolute" left={40} top="2%">
              <GivenOnTimeIcon />
            </StyledView>
          )}
          {title && (
            <StyledText
              fontSize={16}
              fontWeight={700}
              color={selected ? theme.colors.WHITE : theme.colors.PRIMARY_MAIN}
            >
              {title}
            </StyledText>
          )}
        </StyledView>
        <StyledText
          marginTop={10}
          color={
            selected ? theme.colors.MAIN_SUPER_DARK : theme.colors.PRIMARY_MAIN
          }
        >
          {subtitle || type}
        </StyledText>
      </StyledView>
    </TouchableWithoutFeedback>
  );
};
