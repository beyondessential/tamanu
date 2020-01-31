import styled from 'styled-components/native';
import * as styledSystem from 'styled-system';
import { ReactNode } from 'react';

const sizes = [];
for (let i = 0; i < 5; i++) {
  sizes.push(i);
}

export const themeSystem = {
  fontSize: sizes,
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
  textAlign?: string;
  fontSize?: number | string;
  fontWeight?: number | string;
  color?: string;
}
interface SpacingProps {
  height?: string | number;
  width?: string | number;
  padding?: string | number | number[];
  paddingTop?: number | string;
  paddingBottom?: number | string;
  paddingLeft?: number | string;
  paddingRight?: number | string;
  margin?: number[] | string;
  marginRight?: number | string;
  marginLeft?: number | string;
  marginTop?: number | string;
  marginBottom?: number | string;
}

interface PositionProps {
  position?: 'absolute' | 'relative';
  top?: string | number;
  left?: string | number;
  right?: string | number;
  bottom?: string | number;
  zIndex?: number;
}

interface FlexProps {
  flex?: number;
  justifyContent?: string;
  alignItems?: string;
  flexDirection?: string;
  alignSelf?: string;
}
interface Borderprops {
  borderRadius?: number | string;
  borderWidth?: number | string;
  borderColor?: string;
  borderLeftWidth?: number;
  borderRightWidth?: number;
  borderBottomWidth?: number;
  borderTopWidth?: number;
  boxShadow?: string;
}

export interface StyledTextProps
  extends SpacingProps,
    FlexProps,
    Borderprops,
    TextProps {}
interface StyledViewProps
  extends PositionProps,
    SpacingProps,
    FlexProps,
    Borderprops {
  children?: ReactNode | Element[];
  background?: string;
  overflow?: string;
  pose?: string;
}

export const StyledView = styled.View<StyledViewProps>`  
  ${styledSystem.size}
  ${styledSystem.position}
  ${styledSystem.overflow}        
  ${styledSystem.margin}  
  ${styledSystem.padding}  
  ${styledSystem.flexbox}     
  ${styledSystem.background}    
  ${({ borderLeftWidth }) => `border-left-width: ${borderLeftWidth}` || 0};  
  ${styledSystem.boxShadow}
  ${styledSystem.zIndex}
`;

export const StyledSafeAreaView = styled.SafeAreaView<StyledViewProps>`    
  ${styledSystem.size}  
  ${styledSystem.margin}  
  ${styledSystem.padding}  
  ${styledSystem.flexbox}     
  ${styledSystem.background}
  ${styledSystem.overflow}       
  ${styledSystem.position}  
  ${({ borderLeftWidth = 0 }) => `border-left-width: ${borderLeftWidth}`};
  ${({ borderRightWidth = 0 }) => `border-right-width: ${borderRightWidth}`};
  ${({ borderTopWidth = 0 }) => `border-top-width: ${borderTopWidth}`};
  ${({ borderBottomWidth = 0 }) => `border-bottom-width: ${borderBottomWidth}`};
`;

export const StyledText = styled.Text<StyledTextProps>`
  ${styledSystem.color}    
  ${styledSystem.fontWeight}
  ${styledSystem.fontSize}
  ${styledSystem.textAlign}
  ${styledSystem.size}  
  ${styledSystem.margin}  
  ${styledSystem.padding}  
  ${styledSystem.flexbox}     
  ${styledSystem.background}
`;

interface StyledImageProps {
  height?: string | number;
  width?: string | number;
}

export const StyledImage = styled.Image<StyledImageProps>`
  ${styledSystem.height}
  ${styledSystem.width}
`;

export const CenterView = styled(StyledView)`
  display: flex;
  flex: 1;
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

export const StyledScrollView = styled(StyledView)``;
