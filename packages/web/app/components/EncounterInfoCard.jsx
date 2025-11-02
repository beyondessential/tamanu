import React from 'react';
import styled from 'styled-components';
import { Colors } from '../constants';

const CardBody = styled.div`
  position: relative;
  max-width: 1050px;
  display: flex;
  gap: 50px;
`;

const CardCell = styled.div`
  display: flex;
  align-items: baseline;
  font-size: ${props => props.$fontSize}px;
  line-height: 18px;
  position: relative;
  color: ${props => props.theme.palette.text.tertiary};
  white-space: ${props => (props.$whiteSpace ? props.$whiteSpace : 'nowrap')};
`;

const CardIcon = styled.img`
  position: relative;
  top: 2px;
  margin-right: 10px;
`;

const CardLabel = styled.span`
  white-space: nowrap;
  color: ${props => props.theme.palette.text.secondary};
`;

const CardValue = styled.span`
  font-weight: 500;
  color: ${props => props.theme.palette.text.primary};
  width: 100%;
  vertical-align: bottom;
`;

const Card = styled.div`
  background: white;
  box-shadow: ${({ $elevated }) => ($elevated ? '2px 2px 25px rgba(0, 0, 0, 0.1)' : 'none')};
  border-bottom: 1px solid ${Colors.softOutline};
  padding: ${props => `${props.$contentPadding ?? 32}px`};
  padding-top: ${props => `${props.$paddingTop ?? props.$contentPadding}px`};
  ${CardLabel} {
    ${({ $inlineValues }) => ($inlineValues ? 'margin-right: 5px' : 'margin-bottom: 8px')};
    &:first-child:after {
      content: ${({ $inlineValues }) => ($inlineValues ? "':'" : '')};
    }
  }
  ${CardValue} {
    display: ${({ $inlineValues }) => ($inlineValues ? 'inline-block' : 'block')};
  }
`;

const CardEntry = styled.div`
  max-width: 100%;
`;

const InfoCardEntry = ({ label, value }) => (
  <CardEntry data-testid="cardentry-bzr3">
    <CardLabel data-testid="cardlabel-0v8z">{label}</CardLabel>
    <CardValue data-testid="cardvalue-1v8z">{value}</CardValue>
  </CardEntry>
);

export const EncounterInfoCardItem = ({
  label,
  value,
  numberOfColumns = 2,
  fontSize = 14,
  borderHeight,
  icon,
  ...props
}) => (
  <CardCell
    $numberOfColumns={numberOfColumns}
    $fontSize={fontSize}
    $borderHeight={borderHeight}
    {...props}
    data-testid="cardcell-ns7j"
  >
    <CardIcon src={icon} data-testid="cardicon-rfic" />
    <InfoCardEntry label={label} value={value} icon={icon} data-testid="infocardentry-09z6" />
  </CardCell>
);

export const EncounterInfoCard = ({
  children,
  elevated,
  contentPadding,
  paddingTop,
  inlineValues,
  headerContent = null,
  numberOfColumns = 2,
}) => (
  <Card
    $elevated={elevated}
    $inlineValues={inlineValues}
    $contentPadding={contentPadding}
    $paddingTop={paddingTop}
    data-testid="card-664y"
  >
    {headerContent}
    <CardBody $numberOfColumns={numberOfColumns} data-testid="cardbody-m456">
      {children}
    </CardBody>
  </Card>
);
