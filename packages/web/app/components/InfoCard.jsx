import React from 'react';
import styled from 'styled-components';
import { TAMANU_COLORS } from '@tamanu/ui-components';

const GRID_ROW_GAP = 18;

const CardHeader = styled.div`
  border-bottom: 1px solid ${TAMANU_COLORS.softOutline};
  padding-bottom: 10px;
  margin-bottom: 15px;
  color: ${(props) => props.theme.palette.text.tertiary};
  font-size: 16px;
`;

const CardBody = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: repeat(${(props) => props.$numberOfColumns}, 1fr);
  grid-column-gap: 30px;
  grid-row-gap: ${GRID_ROW_GAP}px;
  max-width: 1050px;
`;

const CardCell = styled.div`
  font-size: ${(props) => props.$fontSize}px;
  line-height: 21px;
  position: relative;
  color: ${(props) => props.theme.palette.text.tertiary};
  &:not(:nth-child(${(props) => props.$numberOfColumns}n + 1))::before {
    content: '';
    position: absolute;
    left: -20px;
    top: -${({ $numberOfColumns, $borderHeight = 0 }) =>
        GRID_ROW_GAP / $numberOfColumns - $borderHeight}px;
    bottom: -${({ $numberOfColumns, $borderHeight = 0 }) =>
        GRID_ROW_GAP / $numberOfColumns - $borderHeight}px;
    border-left: 1px solid ${TAMANU_COLORS.softOutline};
    ${(props) => (props.$borderHeight ? `height: ${props.$borderHeight}px` : '')};
  }
`;

const CardLabel = styled.span``;

const CardValue = styled(CardLabel)`
  font-weight: 500;
  color: ${(props) => props.theme.palette.text.secondary};
`;

const Card = styled.div`
  background: white;
  box-shadow: ${({ $elevated }) => ($elevated ? '2px 2px 25px rgba(0, 0, 0, 0.1)' : 'none')};
  border-radius: 5px;
  padding: ${(props) => `${props.$contentPadding || 32}px`};
  border: 1px solid ${TAMANU_COLORS.outline};
  ${(props) =>
    props.$contentMarginBottom ? `margin-bottom: ${props.$contentMarginBottom}px` : ''};

  ${CardLabel} {
    ${({ $inlineValues }) => ($inlineValues ? 'margin-right: 5px' : 'margin-bottom: 8px')};
    &:first-child:after {
      content: ${({ $inlineValues }) => ($inlineValues ? "':'" : '')};
    }
  }
  ${CardValue} {
    display: ${({ $inlineValues }) => ($inlineValues ? 'inline' : 'block')};
  }
`;

const InfoCardEntry = ({ label, value }) => (
  <>
    <CardLabel data-testid="cardlabel-6kys">{label}</CardLabel>
    <CardValue data-testid="cardvalue-lcni">{value}</CardValue>
  </>
);

export const InfoCardHeader = ({ label, value, ...props }) => (
  <CardHeader {...props} data-testid="cardheader-9dpu">
    <InfoCardEntry label={label} value={value} data-testid="infocardentry-20gx" />
  </CardHeader>
);

export const InfoCardItem = ({
  label,
  value,
  numberOfColumns = 2,
  fontSize = 16,
  borderHeight,
  ...props
}) => (
  <CardCell
    $numberOfColumns={numberOfColumns}
    $fontSize={fontSize}
    $borderHeight={borderHeight}
    {...props}
    data-testid="cardcell-8efu"
  >
    <InfoCardEntry label={label} value={value} data-testid="infocardentry-f5nj" />
  </CardCell>
);

export const InfoCard = ({
  children,
  elevated,
  contentPadding,
  contentMarginBottom,
  inlineValues,
  headerContent = null,
  numberOfColumns = 2,
}) => (
  <Card
    $elevated={elevated}
    $inlineValues={inlineValues}
    $contentPadding={contentPadding}
    $contentMarginBottom={contentMarginBottom}
    data-testid="card-7f9h"
  >
    {headerContent}
    <CardBody $numberOfColumns={numberOfColumns} data-testid="cardbody-3iyj">
      {children}
    </CardBody>
  </Card>
);
