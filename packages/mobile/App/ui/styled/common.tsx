import { ReactNode } from 'react';
import styled from 'styled-components/native';
import {
  alignItems,
  background,
  boxShadow,
  color,
  flexbox,
  flexGrow,
  fontSize,
  fontStyle,
  fontWeight,
  height,
  justifyContent,
  lineHeight,
  margin,
  maxHeight,
  maxWidth,
  minHeight,
  minWidth,
  overflow,
  padding,
  position,
  size,
  textAlign,
  width,
  zIndex,
} from 'styled-system';
import SafeAreaView from 'react-native-safe-area-view';
import { ScrollView } from 'react-native-gesture-handler';
import { Value } from 'react-native-reanimated';
import { GestureResponderEvent } from 'react-native';

const sizes = [];
for (let i = 0; i < 10; i++) {
  sizes.push(i);
}

export const themeSystem = {
  fontSizes: sizes,
  marginLeft: sizes,
  space: sizes,
  marginRight: sizes,
  marginTop: sizes,
  marginBottom: sizes,
  paddingLeft: sizes,
  paddingRight: sizes,
  paddingTop: sizes,
  paddingBottom: sizes,
};

interface TextProps {
  textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  lineHeight?: number | string;
  fontSize?: number | string | Value<number>;
  fontWeight?: number | string;
  textDecorationLine?: 'none' | 'underline' | 'line-through' | 'underline line-through';
  color?: string;
}
export interface SpacingProps {
  minHeight?: string | number | Value<number>;
  minWidth?: string | number | Value<number>;
  maxHeight?: string | number | Value<number>;
  maxWidth?: string | number | Value<number>;
  height?: string | number | Value<number>;
  width?: string | number | Value<number>;
  padding?: string | number | number[];
  paddingTop?: number | string;
  paddingBottom?: number | string;
  paddingLeft?: number | string;
  paddingRight?: number | string;
  margin?: number[] | number | string;
  marginRight?: number | string;
  marginLeft?: number | string;
  marginTop?: number | string;
  marginBottom?: number | string;
}

interface PositionProps {
  position?: 'absolute' | 'relative';
  top?: string | number | Value<number>;
  left?: string | number | Value<number>;
  right?: string | number | Value<number>;
  bottom?: string | number | Value<number>;
  zIndex?: number;
}

interface FlexProps {
  flex?: number;
  justifyContent?: string;
  alignItems?: string;
  flexDirection?: string;
  alignSelf?: string;
  flexGrow?: number | string;
}
interface BorderProps {
  borderRadius?: number | string;
  borderStyle?: 'dashed' | 'dotted' | 'solid';
  borderWidth?: number | string;
  borderColor?: string;
  borderLeftWidth?: number;
  borderRightWidth?: number;
  borderBottomWidth?: number;
  borderTopWidth?: number;
  boxShadow?: string;
}

interface VisibilityProps {
  opacity?: string | number | Value<number>;
}

export interface StyledTextProps extends SpacingProps, FlexProps, BorderProps, TextProps {}
export interface StyledViewProps
  extends PositionProps,
    SpacingProps,
    VisibilityProps,
    FlexProps,
    BorderProps {
  children?: ReactNode | Element[];
  background?: string;
  overflow?: string;
  pose?: string;
}

export const StyledView = styled.View<StyledViewProps>`
  ${size}
  ${position}
  ${overflow}
  ${margin}
  ${padding}
  ${flexbox}
  ${flexGrow}
  ${background}
  ${({ borderLeftWidth }): string | number =>
    borderLeftWidth ? `border-left-width: ${borderLeftWidth}` : 0};
  ${({ borderBottomWidth }): string | number =>
    borderBottomWidth ? `border-bottom-width: ${borderBottomWidth}` : 0};
  ${boxShadow}
  ${zIndex}
  ${justifyContent}
  ${alignItems}
  ${height}
  ${minHeight}
  ${minWidth}
  ${maxHeight}
  ${maxWidth}
`;

export const StyledSafeAreaView = styled(SafeAreaView)<StyledViewProps>`
  ${size}
  ${margin}
  ${padding}
  ${flexbox}
  ${background}
  ${overflow}
  ${position}
  ${({ borderLeftWidth = 0 }): string => `border-left-width: ${borderLeftWidth}`};
  ${({ borderRightWidth = 0 }): string => `border-right-width: ${borderRightWidth}`};
  ${({ borderTopWidth = 0 }): string => `border-top-width: ${borderTopWidth}`};
  ${({ borderBottomWidth = 0 }): string => `border-bottom-width: ${borderBottomWidth}`};
`;

export const StyledNavigationView = styled(SafeAreaView)<StyledViewProps>`
  ${size}
  ${margin}
  ${padding}
  ${flexbox}
  ${background}
  ${overflow}
  ${position}
  ${({ borderLeftWidth = 0 }): string => `border-left-width: ${borderLeftWidth}`};
  ${({ borderRightWidth = 0 }): string => `border-right-width: ${borderRightWidth}`};
  ${({ borderTopWidth = 0 }): string => `border-top-width: ${borderTopWidth}`};
  ${({ borderBottomWidth = 0 }): string => `border-bottom-width: ${borderBottomWidth}`};
`;

export const StyledText = styled.Text<StyledTextProps>`
  ${color}
  ${fontWeight}
  ${fontSize}
  ${fontStyle}
  ${lineHeight}
  ${textAlign}
  ${size}
  ${margin}
  ${padding}
  ${flexbox}
  ${background}
  ${({ borderBottomWidth }): string | number => `border-left-width: ${borderBottomWidth || 0}`};
  text-decoration-line: ${({ textDecorationLine }): string => textDecorationLine || 'none'};
`;

interface StyledImageProps {
  height?: string | number;
  width?: string | number;
  textAlign?: string;
}

export const StyledImage = styled.Image<StyledImageProps>`
  ${height}
  ${width}
`;

interface StyledTouchableOpacityProps extends StyledViewProps {
  children?: ReactNode | Element[];
  onPress: (e?: GestureResponderEvent) => void;
}

export const StyledTouchableOpacity = styled.TouchableOpacity<StyledTouchableOpacityProps>`
  ${color}
  ${fontWeight}
  ${fontSize}
  ${textAlign}
  ${size}
  ${margin}
  ${padding}
  ${flexbox}
  ${background}
`;

export const FullView = styled(StyledView)`
  display: flex;
  flex: 1;
`;

export const CenterView = styled(StyledView)`
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const RotateView = styled(StyledView)`
  transform: rotate(90deg);
`;

export const HalfSizeView = styled(StyledView)`
  width: 50%;
`;

export const RowView = styled(StyledView)`
  flex-direction: row;
`;

export const ColumnView = styled(StyledView)`
  flex-direction: column;
`;

export const StyledScrollView = styled(ScrollView)<StyledViewProps>`
  ${size}
  ${position}
  ${overflow}
  ${margin}
  ${padding}
  ${flexbox}
  ${background}
  ${boxShadow}
  ${zIndex}
`;
