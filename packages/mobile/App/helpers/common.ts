import styled from 'styled-components/native';
import { ReactNode } from 'react';
import theme from '../styled/theme';

interface StyledViewProps {
  children?: ReactNode;
  height?: string;
  width?: string;
  flex?: number;
  borderColor?: string;
  borderRadius?: string;
  borderWidth?: string;
  borderLeftWidth?: string;
  paddingLeft?: string;
  paddingTop?: string;
  paddingBottom?: string;
  paddingRight?: string;
  marginRight?: string;
  marginLeft?: string;
  marginTop?: string;
  marginBottom?: string;
  justifyContent?: string;
  alignItems?: string;
  background?: string;
  overflow?: string;
}

export const StyledView = styled.View`
  flex: ${(props: StyledViewProps) => (props.flex ? props.flex : 'none')};
  /**border */
  border-radius: ${(props: StyledViewProps) =>
    props.borderRadius ? props.borderRadius : '0'};
  border-width: ${(props: StyledViewProps) =>
    props.borderWidth ? props.borderWidth : '0'};
  border-radius: ${(props: StyledViewProps) =>
    props.borderRadius ? props.borderRadius : '0'};
  ${(props: StyledViewProps) =>
    props.borderLeftWidth ? `border-left-width: ${props.borderLeftWidth}` : ''};
  ${(props: StyledViewProps) =>
    props.borderColor ? `border-color: ${props.borderColor}` : ''};
  /**Alignment */
  justify-content: ${(props: StyledViewProps) =>
    props.justifyContent ? props.justifyContent : 'flex-start'};
  align-items: ${(props: StyledViewProps) =>
    props.alignItems ? props.alignItems : 'flex-start'};

  ${(props: StyledViewProps) =>
    props.height ? `height: ${props.height}` : ''};
  ${(props: StyledViewProps) => (props.width ? `width: ${props.width}` : '')};

  padding-left: ${(props: StyledViewProps) =>
    props.paddingLeft ? props.paddingLeft : '0px'};
  padding-top: ${(props: StyledViewProps) =>
    props.paddingTop ? props.paddingTop : '0px'};
  padding-bottom: ${(props: StyledViewProps) =>
    props.paddingBottom ? props.paddingBottom : '0px'};
  padding-right: ${(props: StyledViewProps) =>
    props.paddingRight ? props.paddingRight : '0px'};

  margin-left: ${(props: StyledViewProps) =>
    props.marginLeft ? props.marginLeft : '0px'};
  margin-top: ${(props: StyledViewProps) =>
    props.marginTop ? props.marginTop : '0px'};
  margin-bottom: ${(props: StyledViewProps) =>
    props.marginBottom ? props.marginBottom : '0px'};
  margin-right: ${(props: StyledViewProps) =>
    props.marginRight ? props.marginRight : '0px'};

  background-color: ${(props: StyledViewProps) =>
    props.background ? props.background : theme.colors.WHITE};

  overflow: ${(props: StyledViewProps) =>
    props.overflow ? props.overflow : 'hidden'};
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
