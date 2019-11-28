import styled from 'styled-components/native';
import * as styledSystem from 'styled-system';
import { ReactNode } from 'react';

interface TextProps {
  textAlign?: string;
  fontSize?: number;
  fontWeight?: number;
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

interface FlexProps {
  flex?: number;
  justifyContent?: string;
  alignItems?: string;
}
interface Borderprops {
  borderRadius?: number | string;
  borderWidth?: number | string;
  borderColor?: string;
  borderLeftWidth?: number;
}

interface StyledTextProps
  extends SpacingProps,
    FlexProps,
    Borderprops,
    TextProps {}
interface StyledViewProps extends SpacingProps, FlexProps, Borderprops {
  children?: ReactNode | Element[];
  background?: string;
  overflow?: string;
}
export const StyledView = styled.View<StyledViewProps>`
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
`;

export const StyledAreaView = styled.SafeAreaView<StyledViewProps>`    
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
  ${({ borderLeftWidth }) => `border-left-width: ${borderLeftWidth}` || 0};
`;

export const StyledSafeAreaView = styled.SafeAreaView<StyledViewProps>`    
  ${styledSystem.width}
  ${styledSystem.height}  
  ${styledSystem.margin}
  ${styledSystem.marginRight}   
  ${styledSystem.marginBottom}
  ${styledSystem.marginLeft}
  ${styledSystem.marginTop}
  ${styledSystem.paddingBottom}
  ${styledSystem.paddingRight}
  ${styledSystem.paddingTop}
  ${styledSystem.paddingLeft}
  ${styledSystem.flex}   
  ${styledSystem.justifyContent}   
  ${styledSystem.alignItems}     
  ${styledSystem.background}
  ${styledSystem.overflow}      
  ${({ borderLeftWidth }) => `border-left-width: ${borderLeftWidth}` || 0};
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
