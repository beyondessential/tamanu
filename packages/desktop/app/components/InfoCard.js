import React from 'react';
import styled from 'styled-components';
import { Colors } from '../constants';

const GRID_ROW_GAP = 18;

const CardHeader = styled.div`
  border-bottom: 1px solid ${Colors.softOutline};
  padding-bottom: 10px;
  margin-bottom: 15px;
  color: ${props => props.theme.palette.text.tertiary};
  font-size: 16px;
`;

const CardBody = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: repeat(${props => props.$numberOfColumns}, 1fr);
  grid-column-gap: 30px;
  grid-row-gap: ${GRID_ROW_GAP}px;
  max-width: 1050px;
`;

const CardCell = styled.div`
  font-size: ${props => props.$fontSize}px;
  line-height: 21px;
  position: relative;
  color: ${props => props.theme.palette.text.tertiary};
  &:not(:first-child)::before {
    content: '';
    position: absolute;
    left: -20px;
    top: -${({ $numberOfColumns, $borderHeight = 0 }) => GRID_ROW_GAP / $numberOfColumns - $borderHeight}px;
    bottom: -${({ $numberOfColumns, $borderHeight = 0 }) => GRID_ROW_GAP / $numberOfColumns - $borderHeight}px;
    border-left: 1px solid ${Colors.softOutline};
    ${props => (props.$borderHeight ? `height: ${props.$borderHeight}px` : '')};
  }
`;

const CardLabel = styled.span``;

const CardValue = styled(CardLabel)`
  font-weight: 500;
  color: ${props => props.theme.palette.text.secondary};
`;

const Card = styled.div`
  background: white;
  box-shadow: ${({ $elevated }) => ($elevated ? '2px 2px 25px rgba(0, 0, 0, 0.1)' : 'none')};
  border-radius: 5px;
  padding: ${props => `${props.$contentPadding || 32}px`};
  border: 1px solid ${Colors.outline};

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
    <CardLabel>{label}</CardLabel>
    <CardValue>{value}</CardValue>
  </>
);

export const InfoCardHeader = ({ label, value, ...props }) => (
  <CardHeader {...props}>
    <InfoCardEntry label={label} value={value} />
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
  >
    <InfoCardEntry label={label} value={value} />
  </CardCell>
);

export const InfoCard = ({
  children,
  elevated,
  contentPadding,
  inlineValues,
  headerContent = null,
  numberOfColumns = 2,
}) => (
  <Card $elevated={elevated} $inlineValues={inlineValues} $contentPadding={contentPadding}>
    {headerContent}
    <CardBody $numberOfColumns={numberOfColumns}>{children}</CardBody>
  </Card>
);
