import styled from 'styled-components/native';
import * as styledSystem from 'styled-system';
import { ReactNode } from 'react';
interface SpacingProps {
  height?: string | number;
  width?: string | number;
  p?: string;
  paddingTop?: number;
  paddingbottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  m?: number[] | string;
  mr?: number;
  ml?: number;
  mt?: number;
  mb?: number;
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

export const CenterView = styled(StyledView)`
  display: flex;
  flex: 1;
  justify-content: center;
  align-items: center;
`;

export const RotateView = styled.View`
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
