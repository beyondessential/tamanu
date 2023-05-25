import React from 'react';
import styled from 'styled-components';
import { Colors } from '../constants';

const GRID_ROW_GAP = 18;

const Card = styled.div`
  background: white;
  box-shadow: ${({ $elevated }) => ($elevated ? '2px 2px 25px rgba(0, 0, 0, 0.1)' : 'none')};
  border-radius: 5px;
  padding: 32px 30px;
  border: 1px solid ${Colors.outline};
`;

const CardHeader = styled.div`
  border-bottom: 1px solid ${Colors.softOutline};
  padding-bottom: 12px;
  margin-bottom: 15px;
`;

const CardBody = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-column-gap: 30px;
  grid-row-gap: ${props => props.$gridRowGap}px;
  max-width: 1050px;
`;

const CardCell = styled.div`
  font-size: 16px;
  line-height: 21px;
  position: relative;
  color: ${props => props.theme.palette.text.tertiary};
  &:nth-child(even)::before {
    content: '';
    position: absolute;
    left: -20px;
    top: -${props => props.$gridRowGap / 2}px;
    bottom: -${props => props.$gridRowGap / 2}px;
    border-left: 1px solid ${Colors.softOutline};
  }
`;

const CardLabel = styled.span`
  ${props => (props.$inline ? 'margin-right: 5px' : 'margin-bottom: 8px')};
`;

const CardValue = styled(CardLabel)`
  font-weight: 500;
  color: ${props => props.theme.palette.text.secondary};
  display: ${props => (props.$inline ? 'inline' : 'block')};
`;

const InfoCardEntry = ({ label, value, inline }) => (
  <>
    <CardLabel $inline={inline}>
      {label}
      {inline ? ':' : ''}
    </CardLabel>
    <CardValue $inline={inline}>{value}</CardValue>
  </>
);

export const InfoCardHeader = ({ label, value, inlineValues, ...props }) => (
  <CardHeader {...props}>
    <InfoCardEntry label={label} value={value} inline={inlineValues} />
  </CardHeader>
);

export const InfoCardItem = ({ label, value, inlineValues, gridRowGap, ...props }) => (
  <CardCell {...props} $gridRowGap={gridRowGap}>
    <InfoCardEntry label={label} value={value} inline={inlineValues} />
  </CardCell>
);

export const InfoCard = ({
  children,
  className = '',
  elevated,
  gridRowGap = GRID_ROW_GAP,
  inlineValues = false,
}) => (
  <Card className={className} $elevated={elevated}>
    <CardBody $gridRowGap={gridRowGap}>
      {React.Children.map(
        children,
        child => child && React.cloneElement(child, { inlineValues, gridRowGap }),
      )}
    </CardBody>
  </Card>
);
