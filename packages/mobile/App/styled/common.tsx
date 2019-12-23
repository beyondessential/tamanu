import styled from 'styled-components/native';
import * as styledSystem from 'styled-system';
import { ReactNode } from 'react';

const sizes = [];
for (let i = 0; i < 5; i++) {
  sizes.push(i);
}

export const themeSystem = {
  fontSizes: sizes,
  space: sizes,
  marginLeft: sizes,
  marginRight: sizes,
  marginBottom: sizes,
  marginTop: sizes,
  paddingLeft: sizes,
  paddingRight: sizes,
  paddingBottom: sizes,
  paddingTop: sizes,
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
}
interface Borderprops {
  borderRadius?: number | string;
  borderWidth?: number | string;
  borderColor?: string;
  borderLeftWidth?: number;
  borderRightWidth?: number;
  borderBottomWidth?: number;
  borderTopWidth?: number;
}

interface StyledTextProps
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
  ${styledSystem.position}
  ${styledSystem.width}
  ${styledSystem.height}  
  ${styledSystem.margin}
  ${styledSystem.marginRight}   
  ${styledSystem.marginBottom}
  ${styledSystem.marginLeft}
  ${styledSystem.marginTop}  
  ${styledSystem.padding}
  ${styledSystem.paddingBottom}
  ${styledSystem.paddingRight}
  ${styledSystem.paddingTop}
  ${styledSystem.paddingLeft}
  ${styledSystem.flex}   
  ${styledSystem.flexGrow}
  ${styledSystem.justifyContent}   
  ${styledSystem.alignItems}     
  ${styledSystem.background}
  ${styledSystem.overflow}    
  ${styledSystem.position}
  ${styledSystem.zIndex}
  ${styledSystem.bottom}
  ${styledSystem.top}
  ${styledSystem.left}
  ${styledSystem.right}
  ${styledSystem.flexDirection}
  ${styledSystem.borderWidth}
  ${styledSystem.borderLeft}
  ${styledSystem.borderTop}    
  ${({ borderLeftWidth }) => `border-left-width: ${borderLeftWidth}` || 0};  
  ${styledSystem.zIndex}
`;

export const StyledSafeAreaView = styled.SafeAreaView<StyledViewProps>`    
  ${styledSystem.width}
  ${styledSystem.height}  
  ${styledSystem.margin}
  ${styledSystem.marginRight}   
  ${styledSystem.marginBottom}
  ${styledSystem.marginLeft}
  ${styledSystem.marginTop}  
  ${styledSystem.padding}
  ${styledSystem.paddingBottom}
  ${styledSystem.paddingRight}
  ${styledSystem.paddingTop}
  ${styledSystem.paddingLeft}
  ${styledSystem.flex}   
  ${styledSystem.flexGrow}
  ${styledSystem.justifyContent}   
  ${styledSystem.alignItems}     
  ${styledSystem.background}
  ${styledSystem.overflow}       
  ${styledSystem.position}
  ${styledSystem.zIndex}
  ${styledSystem.bottom}
  ${styledSystem.top}
  ${styledSystem.left}
  ${styledSystem.right}
  ${({ borderLeftWidth = 0 }) => `border-left-width: ${borderLeftWidth}`};
  ${({ borderRightWidth = 0 }) => `border-right-width: ${borderRightWidth}`};
  ${({ borderTopWidth = 0 }) => `border-top-width: ${borderTopWidth}`};
  ${({ borderBottomWidth = 0 }) => `border-bottom-width: ${borderBottomWidth}`};
`;

export const StyledText = styled.Text<StyledTextProps>`
  ${styledSystem.fontSize}
  ${styledSystem.fontWeight}
  ${styledSystem.color}
  ${styledSystem.textAlign}
  ${styledSystem.width}
  ${styledSystem.height}  
  ${styledSystem.margin}
  ${styledSystem.marginRight}   
  ${styledSystem.marginBottom}
  ${styledSystem.marginLeft}
  ${styledSystem.marginTop}  
  ${styledSystem.padding}
  ${styledSystem.paddingBottom}
  ${styledSystem.paddingRight}
  ${styledSystem.paddingTop}
  ${styledSystem.paddingLeft}
  ${styledSystem.flex}   
  ${styledSystem.flexGrow}
  ${styledSystem.justifyContent}   
  ${styledSystem.alignItems}     
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
